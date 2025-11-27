from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
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
