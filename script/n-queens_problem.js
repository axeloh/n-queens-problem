
var n;
var width;
var height;
var xblock;
var yblock;

var board;
var queenYCoordinates;
var heuristicTable;
var totalHeuristicCost;
var globalMins;
var maxAttempts;




function generateInitialState(){
    var number = document.getElementById("N").value;
    if (number < 0 || number == 2 || number == 3) {
        alert("N bust be a nonnegative natural number and not equal 2 or 3.")
        return;
    }
    n = number;
    board = [];
    queenYCoordinates = [];
    heuristicTable = [];
    totalHeuristicCost = Math.pow(10, 1000);
    globalMins = [];
    maxAttempts = 10000;

    // Initializing the board with all empty squares
    initializeBoard();

    // Randomly putting one queen in each column with a total of n queens
    setQueensRandom();

    // "Initialize" the heuristic table
    setHeuristicTable();

    drawBoard();
    drawQueens();


}


function setup() {
    document.getElementById("generateBoard").onclick = generateInitialState;
    document.getElementById("main").onclick = main;
    document.getElementById("test").onclick = test;
}


function test() {
    var number = document.getElementById("N").value;
    if (number < 0 || number == 2 || number == 3) {
        alert("N bust be a nonnegative natural number and not equal 2 or 3.")
        return;
    }

    var totalConflicts = 0;
    var solved = 0;
    var unsolved = 0;
    var numberOfTests = 500;


    for (var i = 0; i < numberOfTests; i++) {
        if (search_loop()){
            solved++;
        }
        else {
            unsolved++;
            totalConflicts += totalHeuristicCost;
        }
        
        setHeuristicTable();
        generateInitialState();
    }
    
    console.log("Testet " + numberOfTests + " problems for n = " + n + ", each with random initial state");
    console.log("Number of solved problems: " + solved);
    console.log("Number of unsolved problems: " + unsolved);
    console.log("Percentage solved: " + (solved/numberOfTests)*100);
    console.log("The average total conflicts was " + totalConflicts/numberOfTests);
}

function main() {
    
    search_loop();
    
    undrawQueens();
    drawQueens();
    
}

function search_loop() {
    var totalTries = 0;
    var currentInitialStateTries = 0;

    while (totalHeuristicCost > 0 && totalTries < maxAttempts) {
        if (currentInitialStateTries > 100) {
            // Restart the initial state and try again
            undrawQueens();
            generateInitialState();
            currentInitialStateTries = 0;
        }
        search();
        totalTries++;
        currentInitialStateTries++;
    }

    if (totalHeuristicCost == 0) {
        console.log("Found a solution.");
        return true;
    }
    else {
        console.log("Did not found a solution in " + maxAttempts + " attempts. Ending with total conflicts = " + totalHeuristicCost);
        return false;
    }
    
}



function search() {
    buildHeuristicTable();

    var globalMin = [-1, -1, Math.pow(10, 1000)];

    for (x = 0; x < n; x++) {
        var columnHeuristics = []
        for (y = 0; y < n; y++) {
            columnHeuristics.push(heuristicTable[y][x])
        }
        var columnMin = Math.min.apply(Math, columnHeuristics)
        var columnMinIndex = columnHeuristics.indexOf(columnMin)

        if (columnMin < globalMin[2]) {
            globalMin = [columnMinIndex, x, columnMin]
            globalMins = [globalMin]
        }
        else if (columnMin === globalMin[2]) {
            globalMins.push([columnMinIndex, x, columnMin])
        }
    }
    
    // If there are multiple global minimums choose randomly 
    if (globalMins.length > 1){
        var index = Math.floor(Math.random() * globalMins.length)
        
        globalMin = globalMins[index]
    }

    // Move the queen 
    var globalMinY = globalMin[0]
    var globalMinX = globalMin[1]
    var newTotalHeuristicCost = globalMin[2]

    var currentQueenY = queenYCoordinates[globalMinX]

    queenYCoordinates[globalMinX] = globalMinY

    board[currentQueenY][globalMinX] = false
    board[globalMinY][globalMinX] = true
    totalHeuristicCost = newTotalHeuristicCost
    return true;
    
    
    //console.log(globalMins);
    //console.log(heuristicTable);
}

function getHeuristicCost() {
    
    // The heuristic cost function h is the number of pairs of queens that are attacking each other, either directly or indirectly.

    var totalConflictsCount = 0
    var totalConflicts = {}

    for (var x = 0; x < n; x ++) {
        for (var y = 0; y < n; y ++) {
            if (board[y][x]) {
                var this_square = [y, x]
                var result = getConflictCount(y, x)
                var conflicts = result[1]
                /*
                Add conflict pairs to the totalConflict-set if the pair is not already there
                The set is made up by key-value pairs where the key is a square,
                and the value is a list of all its conflicting squares to the right
                */

                totalConflicts[this_square] = []
                for (var i = 0; i < conflicts.length; i++) {
                    var conflict_square = conflicts[i]
                    totalConflicts[this_square].push(conflict_square)
                    totalConflictsCount ++;
                }
            }
        }
    }

    return totalConflictsCount
}

function buildHeuristicTable() {
    /*
    The successor of a state are all possible states generated by moving a single queen to another square in the same column.
    This means that each state has 8*7 = 56 successors.
    Making the heuristic cost table for each possible successor obtained by moving a queen within its column.
    */
    for (x = 0; x < n; x++) {
        var queenCoord = queenYCoordinates[x]
        
        board[queenCoord][x] = false
        for (y = 0; y < n; y++) {
            board[y][x] = true
            heuristicTable[y][x] = getHeuristicCost()
            board[y][x] = false
        }
        board[queenCoord][x] = true
    }
}


function getConflictCount(current_y, current_x) {
    conflictSquares = []
    count = 0;

    // Only checks square to the right 

    // Sideways to the right
    var x = current_x + 1
    var y = current_y
    while (x < n) {
        if (board[y][x]){
            conflictSquares.push([y, x])
            count++;
        }
        x++;
    }

    // Diagonally upwards right
    var y = current_y - 1
    var x = current_x + 1 
    while (y >= 0 && x < n) {
        if (board[y][x]){
            conflictSquares.push([y, x]);
            count++;
        }
        y--;
        x++;
    }

    // Diagonally downwards right
    var y = current_y + 1
    var x = current_x + 1 
    while (y < n && x < n) {
        if (board[y][x]){
            conflictSquares.push([y, x]);
            count++;
        }
        y++;
        x++;
    }


    var result = []
    result.push(count)
    result.push(conflictSquares)
    return result;

}


function initializeBoard() {
    for (x = 0; x < n; x++) {
        board[x] = []
        for (y = 0; y < n; y++) {
            board[x].push(false)
        }
    }
}

function drawBoard() {
    width = 62.5*n;;
    height = 62.5*n;
    xblock = width/n;
    yblock = height/n;
    createCanvas(width, height);
    colorize(); 
}


function colorize(){
    for (var x = 0; x < n; x ++) {
        for (var y = 0; y < n; y ++) {
            if ((x + y + 1) % 2 == 0) {
                fill(255, 255, 255); // white
            } else {
                fill(0, 0, 0); // black
            }
            rect(x * xblock, y * yblock, (x + 1) * xblock, (y + 1) * yblock);     
        } 
    }
}





function setQueensRandom() {
    for (var x = 0; x < n; x ++) {
        var queen_y = Math.floor(Math.random() * n)
        for (var y = 0; y < n; y ++) {
            if (y === queen_y){
                board[y][x] = true
                queenYCoordinates[x] = queen_y
            }
        }
    }
}

function drawQueens(){
    for (var x = 0; x < n; x ++) {
        for (var y = 0; y < n; y ++) {
            if (board[y][x]){
                fill('orange')
                ellipse(x*xblock+30, y*yblock+30 , xblock/1.5, yblock/1.5)
            }
            
        }
    }
}

function undrawQueens(){
    for (var y = 0; y < n; y ++) {
        for (var x = 0; x < n; x ++) {
            if ((y + x + 1) % 2 == 0) {
                fill(255, 255, 255); // white
            } else {
                fill(0, 0, 0); // black
            }
            rect(y * xblock, x * yblock, (y + 1) * xblock, (x + 1) * yblock);     
        } 
    }
}

function setHeuristicTable() {
    for (x = 0; x < n; x++) {
        heuristicTable[x] = []
        for (y = 0; y < n; y++) {
            heuristicTable[x].push(0)
        }
    }
}