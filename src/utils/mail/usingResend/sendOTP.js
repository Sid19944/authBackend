import { Resend } from "resend";

const resend = new Resend(`re_QWFGx1BB_KaTMr1TBxNwUQcjaz6gUEneB`);

const sendOTPMail = async (userMail, otp) => {
    console.log(userMail, otp)
  try {
    const data = await resend.emails.send({
      from: `realme19948@gmail.com`,
      to: userMail,
      subject: `Verify Your Account`,
      html: `<h2>${otp}</h2>`,
    });

    console.log("RESEND", data);
  } catch (err) {
    console.log("RESEND", err);
  }
};

export { sendOTPMail };
