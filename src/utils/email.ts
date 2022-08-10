import nodemailer from 'nodemailer';

interface EmailOptions {
  subject?: string;
  email?: string;
  message?: string;
}

const sendEmail = async (options: EmailOptions) => {
  // todo 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST!,
    port: +process.env.EMAIL_PORT!,
    auth: {
      user: process.env.EMAIL_USERNAME!,
      pass: process.env.EMAIL_PASSWORD!,
    },
  });

  // todo 2) Define the email options
  const mailOptions = {
    from: 'Khaled Elkhoreby <elkhoreby@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // todo 3) send the email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
