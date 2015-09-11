"use strict";

var hasExtension = require('rcvrcore/utils/FileUtils').hasExtension;

var Logger = require('rcvrcore/Logger').Logger;
var log = new Logger('XModule');

function XModule(name, appSceneContext, fromJarFile, basePath) {
  log.message(5, "Create new XModule for " + name);
  this.name = name;
  this.appSandbox = null;
  this.moduleReadyPromise = null;
  this.exports = {};
  this.pendingIncludes = {};
  this.moduleNameList = [];
  this.promises = [];
  this.moduleData = {};
  this.appSceneContext = appSceneContext;
  this.imports = {};
  this.log = null;
  this.fromJarFile = fromJarFile;
  this.basePath = basePath;
}

XModule.prototype.load = function(uri) {
  global.exports = self.exports;
  global.module = self;

}

XModule.prototype.getBasePath = function() {
  return this.basePath;
}

XModule.prototype.initSandbox = function(otherSandbox) {
  this.appSandbox = otherSandbox;
  this.log = new Logger(this.name);
}

XModule.prototype.include = function(filePath) {
  var rtnPromise = this.appSceneContext.include(filePath, this);
  this.pendingIncludes[filePath] = rtnPromise;
  return rtnPromise;
}



function getModuleExports(moduleName) {
  this.getModuleExports(moduleName);
}

XModule.prototype.getImports = function(moduleName) {
  var name = this.name;
  if( this.moduleData.hasOwnProperty(moduleName)) {
    var rtnExports = this.moduleData[moduleName];
    if( typeof rtnExports == 'undefined') {
      console.trace(this.name + " getImports(" + moduleName + ") finds no imports defined");
    }
    return rtnExports;
  } else {
    console.error("getImports for " + name + ": module [" + moduleName + "] doesn't exist")
  }
}

XModule.prototype.getModuleExports = function(moduleName) {
  if( this.moduleData.hasOwnProperty(moduleName)) {
    var rtnExports = this.moduleData[moduleName];
    if( typeof rtnExports == 'undefined') {
      console.trace(this.name + " getModuleExports(" + moduleName + ") finds no exports defined");
    }
    return rtnExports;
  } else {
    console.error("getModuleExports: module [" + moduleName + "] doesn't exist")
  }
}

function importModule(requiredModuleSet, params) {
  return this.importModule(requiredModuleSet, params);
}

XModule.prototype.importModule = function(requiredModuleSet, params) {
  var _this = this;
  return new Promise(function(resolve, reject) {
    _this._importModule(requiredModuleSet, function readyCallback(importsArr) {
      resolve(importsArr);
    }) ,
      function failureCallback(error) {
        reject(error);
      }
  } );
}

XModule.prototype._importModule = function(requiredModuleSet, readyCallBack, failedCallback, params) {

  if( readyCallBack == 'undefined' ) {
    console.trace("WARNING: " + 'prepareModule was did not have resolutionCallback parameter: USAGE: prepareModule(requiredModules, readyCallback, [failedCallback])');
  }

  var pathToNameMap = {};
  var requiredModules = requiredModuleSet;
  if( !Array.isArray(requiredModuleSet) ) {
    requiredModules = [];
    for(var key in requiredModuleSet) {
      requiredModules.push(requiredModuleSet[key]);
      pathToNameMap[requiredModuleSet[key]] = key;
    }
  } else {
    for(var k = 0; k < requiredModuleSet.length; ++k) {
      var baseName = requiredModuleSet[k].substring(requiredModuleSet[k].lastIndexOf('/')+1);
      pathToNameMap[requiredModuleSet[k]] = baseName;
    }

  }


  if( requiredModules.length == 0 ) {
    log.message(5, "XModule:  No includes are required for " + this.name);
    if( readyCallBack != null && readyCallBack != 'undefined' ) {
      readyCallBack();
    }
    this.moduleReadyPromise = null;
    return this.getInstance;
  }


  var bPath;
  if( hasExtension(this.name, '.js') ) {
    bPath = this.name.substring(0, this.name.lastIndexOf('.js'));
  } else {
    bPath = this.name;
  }


  var justAdded = false;
  if( !this.appSandbox.importTracking.hasOwnProperty(bPath) ) {
    this.appSandbox.importTracking[bPath] = [];
    justAdded = true;
  }
  for (var k = 0; k < requiredModules.length; ++k) {
    log.message(9, bPath + " REQUIRES " + requiredModules[k]);
    this.appSandbox.importTracking[bPath].push(requiredModules[k]);

    if( this.appSandbox.importTracking.hasOwnProperty(requiredModules[k]) ) {
      var reqArr = this.appSandbox.importTracking[requiredModules[k]];
      if( reqArr.length != 0) {
        for(var j = 0; j < reqArr.length; ++j) {
          if( bPath === reqArr[j]) {
            console.trace("Found circular dependency: " + bPath + " requires " + requiredModules[k] + " which requires " + bPath);
            //process.exit(1);
          }
        }
      }
      //this.appSandbox.importTracking.bPath = [];
    }
  }

  var _this = this;

  // Create a promise that will be fulfilled when all includes/imports have been completed
  var promise = new Promise(function(moduleBuildResolve, moduleBuildReject) {
    if (requiredModules != 'undefined') {
      for (var k = 0; k < requiredModules.length; ++k) {
        var promise = _this.include(requiredModules[k]);
        _this.moduleNameList[k] = requiredModules[k];
        _this.promises[k] = promise;
      }
    } else {
      console.trace("requiredModules undefined");
    }

    // Now wait for all the include/import promises to be fulfilled
    Promise.all(_this.promises).then(function (exports) {
      var exportsMap = {};
      var exportsArr = [];
      for (var k = 0; k < _this.moduleNameList.length; ++k) {
        var ptn = pathToNameMap;
        var resPath = exports[k][1];
        var shortName = ptn[resPath];

        _this.appSandbox[pathToNameMap[exports[k][1]]] = exports[k][0];
        _this.moduleData[_this.moduleNameList[k]]= exports[k][0];
        exportsArr[k] = exports[k][0];
        exportsMap[pathToNameMap[exports[k][1]]] = exports[k][0];
        //console.log("TJC: " + _this.name + " gets: module[" + _this.moduleNameList[k] + "]: " + exports[k][0]);
      }
      log.message(7, "XMODULE ABOUT TO NOTIFY [" + _this.name + "] that all its imports are Ready");
      if( readyCallBack != null && readyCallBack != 'undefined' ) {
        readyCallBack(exportsMap);
      }
      moduleBuildResolve();
      log.message(8, "XMODULE AFTER NOTIFY [" + _this.name + "] that all its imports are Ready");
    }).catch(function (error) {
      console.error("Error - failed to get Remote modules for: " + _this.name + ", error=" + error);
      // notify xreRemoteRequire that the promise can't be kept
      if( failedCallback != null && failedCallback != 'undefined' ) {
        failedCallback();
      }
      moduleBuildReject(error);
    }); // end of individual file promise
  }); // end of module promise

  this.moduleReadyPromise = promise;
  return this.getInstance;
}

module.exports = {
  importModule: importModule,
  XModule: XModule
};