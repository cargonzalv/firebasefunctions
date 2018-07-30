const functions = require('firebase-functions');
const phantom = require('phantom');
const request = require("request");


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();


exports.getInitialData = functions.https.onRequest((request,response)=>{
  let dataRef =admin.database().ref("data");
  var getJson = function(cookie,offset){

    let baseUrl = "/StudentRegistrationSsb/ssb/searchResults/searchResults?";

    //let keyword = "txt_keywordlike=" + (request.query.keyword == undefined ? "" : req.query.keyword);
    let term = "&txt_term=" + "201820"
    let startDate = "&startDatepicker=" + "";
    let endDate = "&endDatePicker=" + "";
    let pageOffset = "&pageOffset=" + offset;
    let pageMaxSize = "&pageMaxSize=50";
    let sort = "&sortColumn=subjectDescription&sortDirection=asc"
    let url = baseUrl + term + startDate + endDate + pageOffset + pageMaxSize + sort;
    url = encodeURI('https://mibanner.uniandes.edu.co' + url)
    var options = {
      url: url,
      method: 'GET',
      encoding: null,
      headers: {
        'Cookie': "JSESSIONID="+cookie,
        'Content-Type': 'application/xhtml+xml; charset=utf-8'
      }

    }

    request(options, function(error, resp, body){
      if (!error && resp.statusCode == 200) {
        var result = JSON.parse(body);
        console.log("onResult: (" + response.statuscode + ")" + JSON.stringify(result));
        result.sessionId = cookie;
        resp.statusCode = statusCode;
        resp.status(200).json(result);
        let totalCount = result.totalCount;
        request({
          url:"https://mibanner.uniandes.edu.co/StudentRegistrationSsb/ssb/classSearch/resetDataForm" ,
          method:"POST",
          headers: {
          'Cookie': "JSESSIONID="+cookie
          }
        },
        function(error,res,body){
            offset += 50;
            if(offset < totalCount){
              result.data.map((clases)=>{
                dataRef.set({...clases}).then((snapshot) => {
                  // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
                  return response.redirect(303, snapshot.ref.toString());
                });
              })
              
              getJson(cookie,offset);
            }
            else{
                result.data.map((clases)=>{

                })

              return admin.database().ref('/data').push({clase}).then((snapshot) => {
                // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
                return response.redirect(303, snapshot.ref.toString());
              });
            }
        })
      }
        else if(error){
            console.log(error)
        }
    });
  }
  enterBanner(getJson);
})


var enterBanner = async (callback)=>{
  const instance = await phantom.create();
  const page = await instance.createPage();
  
  await page.on('onResourceRequested', function(requestData) {
    console.info('Requesting', requestData.url);
  });
  await page.on("onConsoleMessage", function(msg) {
      console.log(msg);
  });
  const status = await page.open('https://mibanner.uniandes.edu.co/StudentRegistrationSsb/ssb/term/termSelection?mode=search');
  const content = await page.property('content');
  let cookies = await page.property("cookies");

  
  //const jquery = await page.includeJs("https://code.jquery.com/jquery-3.3.1.min.js");
  const click1 = await page.evaluate(function(){
    $(".select2-choice").trigger("mousedown");
    console.log("click1")
  })
  const click2 = await setTimeout(()=> page.evaluate(function(){
      $("#select2-results-1 > li:nth-child(1) > div").trigger("mousedown");
      $("#select2-results-1 > li:nth-child(1) > div").trigger("mouseup");
      console.log("click2")
  }),1000)
  const click3 = await setTimeout(()=> page.evaluate(function(){
        $("#term-go").trigger("click")
        console.log("click3")
  }),1500)
  console.log(cookies)
  let cookie = cookies.filter((ck)=>ck.name=="JSESSIONID")[0].value;

  const finish = await setTimeout(()=> { 
    console.log("finish")

    callback(cookie)
  },3000);

}