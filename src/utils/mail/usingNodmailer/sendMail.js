import { transporter } from "./usingNodmailer/mailServer.js";
import { ExpressError } from "../ExpressError.js";

const sendMail = async (userMail, otp) => {
  try {
    const info = await transporter.sendMail({
      from: '"SCAMMER" <realme19948@gmail.com>',
      to: userMail,
      subject: "Verify",
      text: "Use the OTP for Verification", // Plain-text version of the message
      html: `<h1>${otp}</h1>`, // HTML version of the message
    });

    return `OTP successfully send to your ${userMail}`
  } catch (error) {
    console.log(error);
    // throw new ExpressError(400, "Error while Sendin the OTP");
  }
};

export { sendMail };
