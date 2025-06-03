
const SHEET_NAME = "Form Responses 1";
const WEBHOOK_URL = "https://n8n.vebmy.com/webhook/updateUserData1";

  function onFormSubmit(e) {
      try {
          const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
          const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          const values = e.values;
          const mappedData = mapToRowObject(headers, values);

          const payload = {
              type: "new",
              rowData: mappedData
          };

          sendToN8n(payload);
      } catch (err) {
          Logger.log("Error in onFormSubmit: " + err);
      }
  }

  function onEdit(e) {
      try {
          const sheet = e.range.getSheet();
          if (sheet.getName() !== SHEET_NAME) return;

          const row = e.range.getRow();
          if (row === 1) return; // Ignore header edits

          const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          const values = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
          const mappedData = mapToRowObject(headers, values);

          const payload = {
              type: "update",
              rowData: mappedData
          };

          sendToN8n(payload);
      } catch (err) {
          Logger.log("Error in onEdit: " + err);
      }
  }
  function mapToRowObject(headers, values) {
      const obj = {};
      for (let i = 0; i < headers.length; i++) {
          let colName = "timestamp";
          let valInArr =[];
          try{
            valInArr = values[i].split(',');
          }
          catch(ex){
              valInArr.push(values[i]);
          }
          switch (headers[i]) {
               case `What is your name?`: {
                   obj["username"] = values[i];
                   break;
               }
               case `What is your phone number`: {
                  const rawNumber = values[i].replace(/\D/g, ''); // strip non-digits
                  obj["phone_number_raw"] = rawNumber; // keep for debugging
                  break;
              }
               case `What types of updates you want to receive via WhatsApp\r\n[Check all that applies]`: {
                 let tempArr = [];
                 for (let k in valInArr){
                   tempArr.push(enumConverter(valInArr[k].trim()));
                 }
                   obj["prefTopic"] = tempArr;
                   break;
               }
              case `When would you like to receive info of these topics?`: {
                let tempArr = [];
                for (let i =0;i< valInArr.length;i++){
                  tempArr.push(enumConverter(valInArr[i].trim()));
                }
                  obj["frequency"] = tempArr;
                  break;
              }
              case `What's the preferred time you'd like to receive them?`: {
                let tempArr = [];
                for (let k in valInArr){
                  tempArr.push(enumConverter(valInArr[k].trim()));
                }
                  obj["prefTime"] = tempArr;
                  break;
              }
              case `What's the origin country your phone number is from?`: {
                  // Extract just the +49 from "Germany (+49)"
                  const match = values[i].match(/\((\+\d+)\)/);
                  if (match && match[1]) {
                      obj["_country_code"] = match[1].replace('+',''); // store as +49
                  }
                  break;
              }
          }
      }
      if (obj["_country_code"] && obj["phone_number_raw"]) {
          obj["phone_number"] = obj["_country_code"] + obj["phone_number_raw"];
      }
      obj["user_type"]="dr";
      return obj;
  }

  function enumConverter(_input) {
      let retVal = "";
      switch (_input) {
          case `New drug launches`: {retVal = "134b707d-4538-4f3a-b160-5a3053780473";break;}
          case `Clinical trial results`: {retVal = "598dc50f-5e30-42a3-a83d-0651a10e1a7c";break;}
          case `Case studies / usage tips`: {retVal = "2fd25f5a-03f9-40b3-b40d-572651947642";break;}
          case `Sponsorships / speaking opportunities`: {retVal = "b51ff4d7-7946-4ac3-b2fc-d930f0e5013c";break;}
          case `New guidelines`: {retVal = "6c38916b-115c-47fb-ba34-1ba9fee6df1e";break;}
          case `Product price adjustment`: {retVal = "5824b096-e708-4b17-a96a-b96ba7aee18b";break;}
          case `All`: {retVal = "d8a00161-552c-4205-ac4c-56b256b8efab";break;}
          case "Everyday":{ retVal = 8;break;}
          case "Only Monday":{ retVal = 1;break;}
          case "Only Tuesday":{ retVal = 2;break;}
          case "Only Wednesday":{ retVal = 3;break;}
          case "Only Thursday":{ retVal = 4;break;}
          case "Only Friday":{ retVal = 5;break;}
          case "Only Saturday":{ retVal = 6;break;}
          case "Only Sunday":{ retVal = 0;break;}
          case "8.30 - 9am":{ retVal = "0830_0900";break;}
          case "9 - 11am":{ retVal = "0900_1100";break;}
          case "12 - 2pm":{ retVal = "1200_1400";break;}
          case "2 - 5pm":{ retVal = "1400_1700";break;}
          case "5 - 7pm":{ retVal = "1700_1900";break;}
      }
      return retVal;
  }
function sendToN8n(payload) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };

  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log("Webhook POST success: " + response.getResponseCode());
  } catch (err) {
    Logger.log("Webhook error: " + err);
  }
}