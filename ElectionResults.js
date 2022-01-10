// variables
let candidates = [];
let electionName = "";
let electionId = "";

//document elements
let headerElectionName = document.getElementById("HeaderElectionName");
let divErrorStatus = document.getElementById("DivErrorStatus")

//parse query from uri to load target election
const queryString = window.location.search;
let retryCount = 0;
//Wait for database connection, then parse UriQuery, lookup against DB
var interval = setInterval(function () {
  if (database != undefined || retryCount > 10) {
    clearInterval(interval);
    parseUriQuery();
    searchElection();
  }
  else {
    retryCount += 1;
    console.log(`Database not connected, Attempt #:${retryCount}`);
  }
}, 1000);

function parseUriQuery() {

  if (queryString == "") {
    divErrorStatus.innerHTML = "ElectionID Missing from URL"
    return;
  }
  try {
    splitString = queryString.split("=")
    splitString.shift();
    electionId = splitString.join("");
  }
  catch (err) {
    divErrorStatus.innerHTML = `Unable to parse ElectionId from URL err=> ${err.toString()}`;
    return;
  }

}

const delimCharacter = "~";

function searchElection() {
  if (electionId == "") {
    if (divErrorStatus.innerHTML.length == 0) {
      divErrorStatus.innerHTML = "ElectionID Missing from URL"
    }
    return;
  }
  get(ref(database, `Election/${electionId}`)).then(data => {
    if (data.exists()) {
      loadElectionName(data);
      divErrorStatus.innerHTML = ""
    } else {
      divErrorStatus.innerHTML = "Election Not Found in Database"
    }
  })
    .catch(err => {
      divErrorStatus.innerHTML = "Database Error while looking up ElectionID. err=> " + err.toString();
    });;

  //   get(ref(database, `Ballots/${electionId}`)).then(data => {
  //     if (data.exists()) {
  //       loadElectionData(data);
  //       divErrorStatus.innerHTML = ""
  //     } else {
  //       divErrorStatus.innerHTML = "Election Ballots Not Found in Database"
  //     }
  //   })
  //     .catch(err => {
  //       divErrorStatus.innerHTML = "Database Error while looking up ElectionID in Ballots. err=> " + err.toString();
  //     });;
  // }
}

function loadElectionName(electionSnapshot) {

  //id
  electionId = electionSnapshot.key
  let electionData = electionSnapshot.val()
  //name
  electionName = electionData.name;
  console.log(electionData);
  //candidates
  //candidates = unpack(electionData.candidates);
  syncVariablesToInputs();
}

function loadElectionData(electionSnapshot) {

  //id
  console.log(electionData);
  //candidates
  //candidates = unpack(electionData.candidates);
  syncVariablesToInputs();
}

function syncVariablesToInputs() {
  syncName();
  syncCandidates();
  syncErrorStatus();
}
function syncSaveStatus() {
  divSaveStatus.innerHTML = "Vote has not been submitted";
}
function syncErrorStatus() {
  divErrorStatus.innerHTML = "";
}
function syncName() {

  headerElectionName.innerHTML = electionName + " Results";

}
function syncCandidates() {

  // randomize


}


function unpack(packedString) {
  if (packedString.length == 0) {
    return [];
  }
  let unpackedString = atob(packedString);
  let array = unpackedString.split(delimCharacter);
  return array;
}

