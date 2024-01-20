"use strict";
const awsSdk = require('aws-sdk');

module.exports.execute = async (event) => {
  console.log("Function started at: ", new Date());

  try {
    let current_date = new Date().toISOString();
    var params = {
      Name: process.env.parameterName ,
      Value: current_date,
      Overwrite: true
    }
    console.log("SNS topic Emamil ID: ", process.env.topicEmail)
    const ssm = new awsSdk.SSM();
    let previousSavedParam = await ssm.getParameter({ Name: process.env.parameterName }).promise();
    console.log(previousSavedParam)
    await ssm.putParameter(params).promise();
    console.log("Saved the parameter in param store")
    let savedParam = await ssm.getParameter({ Name: process.env.parameterName }).promise();
    console.log(savedParam)

    console.log("Function Executed successfully");
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Your function executed successfully!",
          input: event,
        },
        null,
        2
      ),
    };
  } catch (err) {

    console.log("Some error occured during execution: ", err);
    let sns = new awsSdk.SNS();
    let ssm = new awsSdk.SSM();
    let led = await ssm.getParameter({ Name: process.env.parameterName }).promise();
    let snsParams = {
      TopicArn: process.env.topicArn,
      Message: `Hey your lambda has encountered an error on: ${new Date().toISOString()} please check the logs for the error details and cascade to to others if required.
        Error details: 
        Error: ${err}
        Occured On: ${new Date().toISOString()}
        Lambda Name: ${process.env.lambdaName}
        Last execution date and time: ${led.Parameter.Value}
        Thanks & Regards
        ABC app automation alert`,
      Subject: `Lambda ${process.env.lambdaName} encountered an error on ${new Date().toISOString()} `
    }
    console.log(led)
    await sns.publish(snsParams).promise();

    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: "Some error occured while executing the lambda. Please check the cloud watch log!!!",
          input: event,
        },
        null,
        2
      ),
    }
  }
};
