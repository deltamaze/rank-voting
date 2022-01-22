// variables
let candidates = {};
let ballots = []
let electionName = "";
let electionId = "";
const delimCharacter = "~";
let databaseConnected = false;
let errorHasBeenThrown = false;
let rawElectionData = null;
let rawBallotData = null
// document elements
let headerElectionName = document.getElementById("HeaderElectionName");
let divErrorStatus = document.getElementById("DivErrorStatus")
// parse uri parameters


appStart();

async function appStart() {
  try {
    await waitForDatabaseToConnect();
    parseElectionIdFromUri();
    await loadRawElectionData();
    await loadRawBallotData();
    parseElectionData();
    parseBallotData();
    displayElectionName();
    calculateResults();
  }
  catch (err) {
    console.log(`Error thrown e=> ${err.toString()}`);
    throw (err)
  }
}

function throwUserError(errorMsg) {
  divErrorStatus.innerHTML = errorMsg
  throw errorMsg;
}

async function waitForDatabaseToConnect() {
  return await new Promise(resolve => {
    let keepWaitingCount = 0;
    var interval = setInterval(function () {
      if (database != undefined || keepWaitingCount < 10) {
        clearInterval(interval);
        resolve();
        if (keepWaitingCount < 10) {
        }
        else {
          throwUserError('Database was unable to connect after 10 seconds');
        }
      }
      else {
        retryCount += 1;
        console.log(`Database not connected, Attempt #:${retryCount}`);
      }
    }, 1000);

  });
  // html file should initiate connection to Firebase
  // wait for connection to be established before proceeding with appStart
}

function parseElectionIdFromUri() {
  const uriParameters = window.location.search;
  if (uriParameters == "") {
    throwUserError('ElectionID Missing from URL')
  }

  try {
    splitString = uriParameters.split("=")
    splitString.shift();
    electionId = splitString.join("");
  }
  catch (err) {
    divErrorStatus.innerHTML = `Unable to parse ElectionId from URL err=> ${err.toString()}`;
    throw (err)
  }

  if (electionId == "") {
    throwUserError('ElectionID was not found in from URL');
  }
}

async function loadRawElectionData() {
  await get(ref(database, `Elections/${electionId}`)).then(data => {
    if (data.exists()) {
      rawElectionData = data;
    } else {
      throwUserError(`Snapshot Loaded, but no Election data exist in Database for ElectionId => ${electionId}`)
    }
  })
    .catch(err => {
      throwUserError(`Database Error while looking up Election by ElectionID. err=> ${err.toString()}`)
    });;
}
async function loadRawBallotData() {
  await get(ref(database, `Ballots/${electionId}`)).then(data => {
    if (data.exists()) {
      rawBallotData = data;
    } else {
      throwUserError(`Snapshot Loaded, but no Ballot data exist in Database for ElectionId => ${electionId}`)
    }
  })
    .catch(err => {
      throwUserError(`Database Error while looking up Ballot by ElectionID. err=> ${err.toString()}`)
    });
}

function parseElectionData() {
  //id
  electionId = rawElectionData.key
  let electionData = rawElectionData.val()
  //name
  electionName = electionData.name;
  //candidates
  let rawCandidates = unpack(electionData.candidates);
  rawCandidates.forEach(name => {
    if (candidates[name] == undefined) {
      candidates[name] = (new Candidates());
    }
  })
}

function parseBallotData() {

  let ballotData = rawBallotData.val()
  console.log(ballotData);
  // loop through ballot
  let ballotKeys = Object.keys(ballotData);
  ballots = new Array(ballotKeys.length);
  let insertIndex = 0;
  Object.keys(ballotData).forEach(function (key) {
    let rankedVote = unpack(ballotData[key].rankedCandidates)
    let ballot = new Ballot();
    for (let i = 0; i < rankedVote.length; i++) {
      ballot.addCandidate(rankedVote[i]);
    }
    ballots[insertIndex] = ballot;
    insertIndex += 1;
  })
}

function calculateResults() {
  let candidateKeys = Object.keys(candidates);
  let maxRoundsAllowed = 1000;

  if (candidateKeys.length < 1) {
    console.log("No Candidates Found for Election");
    return;
  }
  if (candidateKeys.length == 1) {
    console.log("Only one Candidate found, winner is:" + candidateKeys[0]);
    return;
  }
  let roundNum = 0;
  while (candidateKeys.length > 1) {
    if(roundNum > maxRoundsAllowed){
      throwUserError(`Round Number exceeded ${maxRoundsAllowed} That's probably not good`)
    }
    tallyVotes(candidateKeys);
    console.log(`Current round: ${roundNum + 1}`)
    console.log('Standings')
    candidateKeys.forEach(key => {
      let targetCandidate = candidates[key];

    })
    // loop through and find candidate with least votes and eliminate
    let choppingBlock = []
    let choppingBlockRound = 1;
    let choppingBlockRoundMinVotes = null;
    roundNum += 1;
    // loop through, find candidate with lower vote, push previous round vote to new round
    // eliminate 

  }
  console.log(`Winner is:${candidateKeys[0]}`);
}
function tallyVotes(candidateKeys) {
  // loop through each candidate and reset votes
  candidateKeys.forEach(key => {
    candidates[key].firstPick = 0;
    candidates[key].secondPick = 0;
    candidates[key].thirdPick = 0;
  })
  // loop through ballot and tally votes for the candidate
  for (let i = 0; i < ballots.length; i += 1) {
    console.log(candidates);
    // first pick
    if (candidates[ballots[i].getFirstPick()] != undefined) {
      candidates[ballots[i].getFirstPick()].firstPick += 1;
    }
    else {
      if (ballots[i].getFirstPick() != 'nil') {
        console.log(`Ballot Candidate ${ballots[i].getFirstPick()} not found`);
      }
    }
    // second pick
    if (candidates[ballots[i].getSecondPick()] != undefined) {
      candidates[ballots[i].getSecondPick()].secondPick += 1;
    }
    else {
      if (ballots[i].getSecondPick() != 'nil') {
        console.log(`Ballot Candidate ${ballots[i].getSecondPick()} not found`);
      }
    }
    // third pick
    if (candidates[ballots[i].getThirdPick()] != undefined) {
      candidates[ballots[i].getThirdPick()].thirdPick += 1;
    }
    else {
      if (ballots[i].getThirdPick() != 'nil') {
        console.log(`Ballot Candidate ${ballots[i].getThirdPick()} not found`);
      }
    }
  }
}
function displayElectionName() {
  headerElectionName.innerHTML = electionName + " Results";
}
function tieBreaker(inputArray) {
  //needs to consistently return the same index for every execution
  throwUserError('NOT IMPLEMENTED')

}


function unpack(packedString) {
  if (packedString.length == 0) {
    return [];
  }
  let unpackedString = atob(packedString);
  let array = unpackedString.split(delimCharacter);
  return array;
}

class Candidates {
  constructor() {
    this.firstPick = 0;
    this.secondPick = 0;
    this.thirdPick = 0;
  }
}

class Ballot {
  constructor() {
    this.rankings = new LinkedList();
  }
  eliminateCandidate(candidateToRemove) {
    let previousNode = this.rankings.head;
    let currentNode = previousNode.next
    if (currentNode) {
      while (currentNode.next) {
        if (currentNode.data == candidateToRemove) {
          previousNode.next = currentNode.next;
          currentNode = previousNode.next;
          currentNode.previous = previousNode;
          continue;
        }
        currentNode = currentNode.next
      }
    }
  }
  addCandidate(candidateToAdd) {
    let newNode = new ListNode(candidateToAdd);
    let referenceTail = this.rankings.tail
    let oldTail = referenceTail.previous
    oldTail.next = newNode;
    newNode.previous = oldTail;
    newNode.next = referenceTail;
    referenceTail.previous = newNode;
  }
  getFirstPick() {
    if (
      this.rankings.head.next != null
    ) {
      return this.rankings.head.next.data;
    }
    return 'nil';
  }
  getSecondPick() {
    if (
      this.rankings.head.next != null &&
      this.rankings.head.next.next != null
    ) {
      return this.rankings.head.next.next.data;
    }
    return 'nil';
  }
  getThirdPick() {
    if (
      this.rankings.head.next != null &&
      this.rankings.head.next.next != null &&
      this.rankings.head.next.next.next != null
    ) {
      return this.rankings.head.next.next.next.data;
    }
    return 'nil';
  }
}

class LinkedList {
  constructor() {
    this.head = new ListNode(null);
    this.tail = new ListNode(null);
    this.head.next = this.tail;
    this.tail.previous = this.head;
  }
}

class ListNode {
  constructor(data) {
    this.data = data
    this.next = null
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
