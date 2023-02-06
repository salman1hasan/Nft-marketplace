import { v4 as uuidv4 } from "uuid";
import { FileReq } from "@_types/nft";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-iron-session";
import { addressCheckMiddleware, pinataApiKey, pinataSecretApiKey, withSession } from "./utils";
import FormData from "form-data";
import axios from "axios";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

export default withSession(async (
  req: NextApiRequest & {session: Session}, 
  res: NextApiResponse
) => {
  if (req.method === "POST") {
    const {
      bytes,
      fileName,
      contentType
    } = req.body as FileReq;
    console.log("HERE!");
    if (!bytes || !fileName || !contentType) {
      return res.status(422).send({message: "Image data are missing"});
    }

    await addressCheckMiddleware(req, res);

    const buffer = Buffer.from(Object.values(bytes));

    const formData = new FormData();

    formData.append(
      "file",
      buffer, {
        contentType,
        filename: fileName + "-" + uuidv4()
      }
    );

    
    await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      maxBodyLength: Infinity,
      headers: {
        'Accept': 'application/json, text/plain',
        "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey
      }
    })
    .then(fileRes => {
      return res.status(200).send(fileRes.data);
    })
    .catch(e => {
      console.log(e.message);
    });
  } else {
    return res.status(422).send({message: "Invalid endpoint"});
  }
})

