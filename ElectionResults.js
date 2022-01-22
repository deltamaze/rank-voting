// variables
let candidates = {};
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
  get(ref(database, `Elections/${electionId}`)).then(data => {
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

  get(ref(database, `Ballots/${electionId}`)).then(data => {
    if (data.exists()) {
      loadBallotData(data);
      divErrorStatus.innerHTML = ""
    } else {
      divErrorStatus.innerHTML = "Election Ballots Not Found in Database"
    }
  })
    .catch(err => {
      divErrorStatus.innerHTML = "Database Error while looking up ElectionID in Ballots. err=> " + err.toString();
    });

  syncVariablesToInputs();
}

function loadElectionName(electionSnapshot) {

  //id
  electionId = electionSnapshot.key
  let electionData = electionSnapshot.val()
  //name
  electionName = electionData.name;
  //candidates
  let rawCandidates = unpack(electionData.candidates);
  rawCandidates.forEach(name => {
    if(candidates[name] == undefined){
      candidates[name] = (new Candidates());
    }
  })
}

function loadBallotData(ballotSnapshot) {


  let ballotData = ballotSnapshot.val()
  console.log(ballotData);
  // loop through ballot

  Object.keys(ballotData).forEach(function (key) {
    var rankedVote = unpack(ballotData[key].rankedCandidates)
    for(let i = 0; i < rankedVote.length; i++){
      if(candidates[rankedVote[i]] != undefined){
        candidates[rankedVote[i]].votePerRank[i] += 1;
      }
    }
  })
  }

function syncVariablesToInputs() {
  syncName();
  syncCandidates();
  syncErrorStatus();
  syncResults();
}
function syncResults() {
  console.log("Not Implemented");
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

class Candidates{
  constructor(){
    this.votePerRank = new Array(1000);
    this.votePerRank.fill(0);
    this.IsEliminated = false;
  }
}


// so if bookclub has 7 books, identify count on the election table

// 7 books

// get all ballots, example: 6 ballots

// 6 ballots means winner needs 3 votes
// if 7 ballots, 50% is 3.5 so round up to 4 votes

// first round, tally up all the ballots[0] against the master list
// master list = {book title, votePoints, roundUpdate, currentRank, isEliminated, previousRank
// book


// getVote(ballot,masterList,roundNum) return selectionName
// -- use master list to skip eliminated entries

// when tie, use base64 encoding string compare to determine winner/elimination

// loop that will state

// Round #
// if round != 0, if foundwinner=false : (elimination text
// Results
// if founderwinner = true
