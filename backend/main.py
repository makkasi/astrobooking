from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase
firebase_creds = os.getenv("FIREBASE_CREDENTIALS")
if firebase_creds:
    # Parse JSON string from env var
    cred_dict = json.loads(firebase_creds)
    cred = credentials.Certificate(cred_dict)
else:
    # Fallback to local file
    cred = credentials.Certificate("serviceAccountKey.json")

# Initialize Firebase
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Booking(BaseModel):
    date: str  # YYYY-MM-DD
    hour: int  # 9-17
    name: str
    email: str
    phone: str
    notes: Optional[str] = None

def send_email(booking: Booking):
    sender_email = os.getenv("MAIL_USERNAME")
    password = os.getenv("MAIL_PASSWORD")
    receiver_email = "kastroguru@gmail.com"

    message = MIMEMultipart("alternative")
    message["Subject"] = f"Нова резервация: {booking.date} в {booking.hour}:00"
    message["From"] = sender_email
    message["To"] = receiver_email

    text = f"""\
    Здравейте,
    
    Имате нова резервация за "Обща астрологична консултация".
    
    Дата: {booking.date}
    Час: {booking.hour}:00
    Име: {booking.name}
    Email: {booking.email}
    Телефон: {booking.phone}
    Бележки: {booking.notes or 'Няма'}
    """
    
    html = f"""\
    <html>
      <body>
        <h2>Нова резервация</h2>
        <p>Имате нова резервация за "Обща астрологична консултация".</p>
        <ul>
            <li><strong>Дата:</strong> {booking.date}</li>
            <li><strong>Час:</strong> {booking.hour}:00</li>
            <li><strong>Име:</strong> {booking.name}</li>
            <li><strong>Email:</strong> {booking.email}</li>
            <li><strong>Телефон:</strong> {booking.phone}</li>
            <li><strong>Бележки:</strong> {booking.notes or 'Няма'}</li>
        </ul>
      </body>
    </html>
    """

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")

    message.attach(part1)
    message.attach(part2)

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, password)
            
            # Send to Admin
            server.sendmail(sender_email, receiver_email, message.as_string())
            print(f"Admin notification sent to {receiver_email}")
            
            # Send to Client
            # Create a new message for the client or reuse/modify the existing one
            # For simplicity, we'll send the same details but maybe change the subject/to header if we were being strict,
            # but reusing the body is fine. Let's create a fresh message object to be safe with headers.
            
            client_message = MIMEMultipart("alternative")
            client_message["Subject"] = f"Потвърждение за резервация: {booking.date} в {booking.hour}:00"
            client_message["From"] = sender_email
            client_message["To"] = booking.email
            
            client_text = f"""\
            Здравейте {booking.name},
            
            Вашата резервация за "Обща астрологична консултация" е потвърдена успешно.
            
            Дата: {booking.date}
            Час: {booking.hour}:00
            
            Очакваме ви!
            """
            
            client_html = f"""\
            <html>
              <body>
                <h2>Резервацията е потвърдена</h2>
                <p>Здравейте {booking.name},</p>
                <p>Вашата резервация за "Обща астрологична консултация" е потвърдена успешно.</p>
                <ul>
                    <li><strong>Дата:</strong> {booking.date}</li>
                    <li><strong>Час:</strong> {booking.hour}:00</li>
                </ul>
                <p>Очакваме ви!</p>
              </body>
            </html>
            """
            
            client_message.attach(MIMEText(client_text, "plain"))
            client_message.attach(MIMEText(client_html, "html"))
            
            server.sendmail(sender_email, booking.email, client_message.as_string())
            print(f"Client confirmation sent to {booking.email}")

        print("Emails sent successfully!")
    except Exception as e:
        print(f"Error sending email: {e}")
        # Don't raise exception to client, just log it. Booking is still valid.

@app.get("/api/availability")
def check_availability(date: str):
    # Query Firestore for bookings on this date
    bookings_ref = db.collection("bookings")
    query = bookings_ref.where("date", "==", date).stream()
    
    # Check if any booking exists for this date
    day_booked = False
    for _ in query:
        day_booked = True
        break
    
    if day_booked:
        return {"available_hours": []}
    
    # If day not booked, all hours 9-17 are available
    return {"available_hours": list(range(9, 18))}

class Product(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    price: float
    image_url: str
    pdf_url: Optional[str] = None # Internal use only

class Order(BaseModel):
    product_id: str
    paypal_order_id: str
    email: str
    name: str

@app.get("/api/products")
def get_products():
    products_ref = db.collection("products")
    docs = products_ref.stream()
    products = []
    for doc in docs:
        p_data = doc.to_dict()
        # Hide the PDF URL from the public API
        if 'pdf_url' in p_data:
            del p_data['pdf_url']
        p_data['id'] = doc.id
        products.append(p_data)
    return products

@app.post("/api/orders")
def create_order(order: Order):
    # 1. Verify Product exists
    product_ref = db.collection("products").document(order.product_id)
    product_doc = product_ref.get()
    
    if not product_doc.exists:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product_data = product_doc.to_dict()
    
    # 2. (Optional) Verify PayPal Order with PayPal API
    # For now, we assume the client is honest in this MVP phase.
    # In production, you MUST verify the order_id with PayPal to ensure payment was actually made.
    
    # 3. Save Order to Firestore
    orders_ref = db.collection("orders")
    new_order = order.dict()
    new_order['timestamp'] = datetime.now().isoformat()
    new_order['amount'] = product_data.get('price', 0)
    new_order['product_title'] = product_data.get('title', 'Unknown')
    orders_ref.add(new_order)
    
    # 4. Share File and Send Email
    pdf_drive_id = product_data.get('pdf_drive_id')
    if pdf_drive_id:
        share_file_with_email(pdf_drive_id, order.email)
    
    send_product_email(order.email, order.name, product_data)
    
    return {"status": "success", "message": "Order processed"}

def send_product_email(email: str, name: str, product: dict):
    sender_email = os.getenv("MAIL_USERNAME")
    password = os.getenv("MAIL_PASSWORD")
    
    message = MIMEMultipart("alternative")
    message["Subject"] = f"Вашата поръчка: {product.get('title')}"
    message["From"] = sender_email
    message["To"] = email
    
    pdf_url = product.get('pdf_url', '#')
    
    text = f"""\
    Здравейте {name},
    
    Благодарим ви за поръчката!
    
    Можете да изтеглите "{product.get('title')}" от следния линк:
    {pdf_url}
    
    Поздрави,
    Екипът на Астро ключ
    """
    
    html = f"""\
    <html>
      <body>
        <h2>Благодарим ви за поръчката!</h2>
        <p>Здравейте {name},</p>
        <p>Вие успешно закупихте <strong>"{product.get('title')}"</strong>.</p>
        <p>
            <a href="{pdf_url}" style="background-color: #FFD700; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Изтегли PDF
            </a>
        </p>
        <p>Ако бутонът не работи, копирайте този линк във вашия браузър:</p>
        <p>{pdf_url}</p>
        <br>
        <p>Поздрави,<br>Екипът на Астро ключ</p>
      </body>
    </html>
    """
    
    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))
    
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, password)
            server.sendmail(sender_email, email, message.as_string())
        print(f"Product email sent to {email}")
    except Exception as e:
        print(f"Error sending product email: {e}")

    except Exception as e:
        print(f"Error sending product email: {e}")

from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2 import service_account
import io

# Initialize Drive API
SCOPES = ['https://www.googleapis.com/auth/drive']
DRIVE_FOLDER_ID = "1dky1FDMaKSR_EPlM6G72YjeHcDl1vYRi"

def get_drive_service():
    if firebase_creds:
        cred_dict = json.loads(firebase_creds)
        creds = service_account.Credentials.from_service_account_info(cred_dict, scopes=SCOPES)
    else:
        creds = service_account.Credentials.from_service_account_file("serviceAccountKey.json", scopes=SCOPES)
    return build('drive', 'v3', credentials=creds)

def upload_to_drive(file_content, filename, mime_type, public=False):
    service = get_drive_service()
    
    file_metadata = {
        'name': filename,
        'parents': [DRIVE_FOLDER_ID]
    }
    
    media = MediaIoBaseUpload(io.BytesIO(file_content), mimetype=mime_type, resumable=True)
    
    file = service.files().create(body=file_metadata, media_body=media, fields='id, webViewLink').execute()
    file_id = file.get('id')
    
    if public:
        # Make public (Reader: anyone)
        permission = {
            'type': 'anyone',
            'role': 'reader',
        }
        service.permissions().create(fileId=file_id, body=permission).execute()
        
    return file_id, file.get('webViewLink')

def share_file_with_email(file_id, email):
    service = get_drive_service()
    try:
        permission = {
            'type': 'user',
            'role': 'reader',
            'emailAddress': email
        }
        service.permissions().create(fileId=file_id, body=permission, emailMessage="Here is your purchased book!").execute()
        print(f"Shared file {file_id} with {email}")
    except Exception as e:
        print(f"Error sharing file: {e}")

@app.post("/api/admin/products")
async def create_product(
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    password: str = Form(...),
    image: UploadFile = File(...),
    pdf: UploadFile = File(...)
):
    # 1. Verify Password
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    if password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin password")

    # 2. Upload Image to Drive (Public)
    image_content = await image.read()
    image_id, image_url = upload_to_drive(image_content, image.filename, image.content_type, public=True)
    
    # For images, webViewLink is a preview page. To embed, we might need a direct link, 
    # but Drive doesn't easily give "hotlinkable" URLs. 
    # However, 'webViewLink' works for clicking. 
    # For <img> tags, we can try using the thumbnail link or a specific export link, 
    # but let's stick to the official link for now. 
    # Actually, for <img> tags, we can use `https://drive.google.com/uc?id={FILE_ID}` hack.
    image_direct_link = f"https://drive.google.com/uc?id={image_id}"

    # 3. Upload PDF to Drive (Private)
    pdf_content = await pdf.read()
    pdf_id, pdf_url = upload_to_drive(pdf_content, pdf.filename, pdf.content_type, public=False)

    # 4. Save to Firestore
    products_ref = db.collection("products")
    new_product = {
        "title": title,
        "description": description,
        "price": price,
        "image_url": image_direct_link, # Use the direct link hack for <img> tags
        "pdf_drive_id": pdf_id,         # Store ID to share later
        "pdf_url": pdf_url,             # Store URL for reference
        "timestamp": datetime.now().isoformat()
    }
    products_ref.add(new_product)

    return {"status": "success", "message": "Product created successfully"}

@app.post("/api/book")
def create_booking(booking: Booking):
    bookings_ref = db.collection("bookings")
    
    # Validate hour
    if not (9 <= booking.hour <= 17):
        raise HTTPException(status_code=400, detail="Hour must be between 9 and 17")

    # Check if day is already booked
    query = bookings_ref.where("date", "==", booking.date).stream()
    for _ in query:
        raise HTTPException(status_code=400, detail="This day is already fully booked")

    # Save booking to Firestore
    new_booking = booking.dict()
    new_booking['timestamp'] = datetime.now().isoformat()
    
    bookings_ref.add(new_booking)
    
    # Send Email
    send_email(booking)
    
    return {"status": "success", "message": "Booking confirmed"}
