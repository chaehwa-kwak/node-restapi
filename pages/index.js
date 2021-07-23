import * as Environment from "~/node_common/environment";

export default async (req, res) => {
  return res.status(200).json({ 
    decorator: "MyLink O2 Server", 
    status: 200, 
    data: true
  });  
};
