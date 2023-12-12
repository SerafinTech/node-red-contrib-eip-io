(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){(function (){
let {ParseEDS, GetAssembly} = require('st-eds-parse')
global.Serafintech = {ParseEDS: ParseEDS, GetAssembly: GetAssembly}
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"st-eds-parse":4}],2:[function(require,module,exports){
exports.EDSToObj = function(edsString) {
    let obj = {};
    let lineArray = edsString.replace(/\r\n/g,'\n').split("\n");
    lineArray = removeComments(lineArray);
    lineArray = removeSpaces(lineArray);
    lineArray = removeBlankLines(lineArray);
    lineArray = splitQuotes(lineArray.join(''), ';');
    lineArray = removeBlankLines(lineArray);
    lineArray = sepSectionName(lineArray);
    obj = initObj(lineArray);

    return obj;
}

exports.splitQuotes = splitQuotes;

function initObj(lineArray) {
    let obj = {};
    let currentCat = ''
    lineArray.forEach(line => {
        if (line[0] === '[') {
            currentCat = line.slice(1,-1);
            obj[currentCat] = {};
        } else {
            let item = splitQuotes(line, '=')
            obj[currentCat][item[0]] = item[1];
        }
    })

    return obj;
}

function sepSectionName(array) {
    let result = []
    array.forEach(item => {
        if (item[0] === '[') {
            result.push(item.slice(0,item.search("]") + 1));
            result.push(item.slice(item.search("]") + 1))
        } else {
            result.push(item)
        }
    })

    return result;
}

function splitQuotes(str, sep) {
    let array = [];
    let item = '';
    let quotes = 0;
    for (i = 0; i < str.length; i++) {
        if (str[i] === sep && !(quotes % 2)) {
            array.push(item);
            item = '';
        } else {
            item = item + str[i]
            if (str[i] === '"') {
                quotes++;
            }
        }
    }
    if (item.length > 0) {
        array.push(item);
    }
    return array;
}

function removeSpaces(lines) {
    return lines.map(line => line.replace(/([^"]+)|("[^"]+")/g, (x,y,z) => {return (y) ? y.replace(/\s/g, '') : z})) 
}

function removeBlankLines (a) {
 return a.filter(line => line.trim().length !== 0);
}

function removeComments (lines) {
    let commentPosition = str => {
        let quotes = 0
        let position = -1
        for (let i = 0; i < str.length; i++) {
            if (str[i] === '"') quotes++;
            if (str[i] === '$' && !(quotes % 2)) {
                position = i;
                break;
            }
        }
        return position;
    }
    
    return lines.map(line => {
        let newLine = line.trim()
        let cp = commentPosition(newLine)
        if (cp > -1) {
            newLine = newLine.slice(0,cp)
        }
        return newLine.trim()
    })
}

},{}],3:[function(require,module,exports){
exports.connection = array => {
    return {
        triggerAndTransport: parseInt(array[0]),
        connectionParams: parseInt(array[1]),
        OTrpi: array[2],
        OTsize: array[3],
        OTformat: array[4],
        TOrpi: array[5],
        TOsize: array[6],
        TOformat: array[7],
        proxyConfigSize: array[8],
        proxyConfigFormat: array[9],
        targetConfigSize: array[10],
        targetConfigFormat: array[11],
        connectionName: array[12],
        helpString: array[13],
        path: array[14]
    }
}

exports.parameter = array => {
    return {
        linkSize: array[1],
        linkPath: array[2],
        descriptor: parseInt(array[3]),
        dataType: parseInt(array[4]),
        dataSize: parseInt(array[5]),
        name: array[6],
        units: array[7],
        helpString: array[8],
        minValue: parseInt(array[9]),
        maxValue: parseInt(array[10]),
        defaultValue: parseInt(array[11]),
        scalingMult: array[12],
        scalingDiv: array[13],
        scalingBase: array[14],
        scalingOffset: array[15],
        linksMult: array[16],
        linksDiv: array[17],
        linksBase: array[18],
        linksOffset: array[19],
        decimalPlaces: parseInt(array[20])
    }
}

exports.enum = array => {
    let result = [];
    for (let i = 0; i < array.length; i+=2) {
        result.push({
            value: parseInt(array[i]),
            name: array[i+1]
        });
    }
    return result;
}

exports.assembly = array => {
    let params = [];
    for(let i = 6; i < array.length; i+=2) {
            params.push({
                name: array[i+1],
                size: parseInt(array[i])
            })   
    }
    return {
        name: array[0],
        path: array[1],
        size: parseInt(array[2]),
        descriptor: parseInt(array[3]),
        params: params
    }
}
},{}],4:[function(require,module,exports){
const {EDSToObj, splitQuotes} = require('./edsToObj');
const EDSTypes  = require('./edsTypes')


exports.ParseEDS = function(str) {
    let eds = EDSToObj(str);

    if(eds.ConnectionManager) {
        Object.keys(eds.ConnectionManager).forEach(item => {
            if (item.slice(0,10) === 'Connection') {
                eds.ConnectionManager[item] = EDSTypes.connection(splitQuotes(eds.ConnectionManager[item], ','))
            }
        });
    }

    if(eds.Params) {
        Object.keys(eds.Params).forEach(item => {
            if (item.slice(0,5) === 'Param') {
                eds.Params[item] = EDSTypes.parameter(splitQuotes(eds.Params[item], ','))
            };
            if (item.slice(0,4) === 'Enum') {
                eds.Params[item] = EDSTypes.enum(splitQuotes(eds.Params[item], ','))
            };
        })
    }
    
    if (eds.Assembly) {
        Object.keys(eds.Assembly).forEach(item => {
            if (item.slice(0,5) === 'Assem') {
                eds.Assembly[item] = EDSTypes.assembly(splitQuotes(eds.Assembly[item], ','))
            }
        });
    }
    return eds;
}


exports.GetAssembly = function(eds, n) {
    let assembly = eds.Assembly['Assem'+n.toString()];
    assembly.id = n
    for(let i = 0; i < assembly.params.length; i++) {
        assembly.params[i].name = (assembly.params[i].name === undefined) ? '' : assembly.params[i].name;
        if (assembly.params[i].name.slice(0,5) === 'Param') {
            assembly.params[i].info = {};
            assembly.params[i].info = eds.Params[assembly.params[i].name];
            assembly.params[i].enum = eds.Params['Enum' + assembly.params[i].name.slice(5)]
        } else if (!isNaN(assembly.params[i].name)) {
            assembly.params[i].info = {};
            assembly.params[i].value = Number(assembly.params[i].name)
        } else if (assembly.params[i].name.slice(0,5) === 'Assem') {
            let assem = exports.GetAssembly(eds,assembly.params[i].name.slice(5))
            assembly.params[i].info = assem
        }        
    }
    return assembly;
}


},{"./edsToObj":2,"./edsTypes":3}]},{},[1]);
