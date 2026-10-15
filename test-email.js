
require("dotenv").config();

const nodemailer = require("nodemailer");

const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;

if (!MAIL_USER || !MAIL_PASS) {
  console.error("ERROR: MAIL_USER or MAIL_PASS is missing in .env");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,

  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 60000,

  logger: true,
  debug: true,
});

async function testEmail() {
  try {
    console.log("Testing Gmail SMTP connection...");

    await transporter.verify();

    console.log("SMTP connection successful!");
    console.log("Sending test email...");

    const result = await transporter.sendMail({
      from: MAIL_USER,
      to: MAIL_USER,
      subject: "Spices App SMTP Test",
      text: "Success! Gmail SMTP is working correctly.",
    });

    console.log("Test email sent successfully!");
    console.log("Message ID:", result.messageId);
  } catch (error) {
    console.error("\nSMTP TEST FAILED");
    console.error("Error code:", error.code || "UNKNOWN");
    console.error("Error message:", error.message);

    if (error.code === "ESOCKET") {
      console.error(
        "Check your network, Node.js certificate trust, and SMTP connection."
      );
    }

    if (error.code === "EAUTH") {
      console.error(
        "Check your Gmail address and Google App Password in .env."
      );
    }
  } finally {
    transporter.close();
  }
}

testEmail();
