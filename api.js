
//since the api will be globally accessible, just set it to result of function call

FileAPI = (function(Q){
    "use strict";

    /*
        File class
        - type determines if we're dealing with a folder or a standard file
        - name is name of folder/file
        - path is full path including folder/file name
        - content is null since we're really just testing API and not actually creating files
        - files is array of files contained in folder
     */
//committing
    function File(file){
        this.type = typeof file.type === 'undefined' ? File.TYPES.FILE : file.type;
        this.name = file.name || "";
        this.path = file.path || "";
        this.content = null; //something we presumably don't have to worry about for this test
        this.files = {};
    }

    File.TYPES = {
        FOLDER: 0,
        FILE: 1
    };

    File.prototype.getFileName = function(fullPath){

        if(typeof fullPath === 'undefined'){
            fullPath = this.path;
        }

        if(fullPath.lastIndexOf("/") === -1){
            return fullPath;
        }
        else {
            return fullPath.substring(fullPath.lastIndexOf("/") + 1);
        }

    };

    File.prototype.getParentFolderPath = function(fullPath){

        if(typeof fullPath === 'undefined'){
            fullPath = this.path;
        }

        if(fullPath.lastIndexOf("/") === -1){
            return "";
        }
        else {
            return fullPath.substring(0, fullPath.lastIndexOf("/"));
        }

    };

    File.prototype.constructFilePath = function(parentDirectoryPath, fileName){
        return (parentDirectoryPath === "" ? "" : parentDirectoryPath + "/") + fileName;
    };

    File.prototype.create = function(fullPath, fileType){

        if(typeof fullPath === 'object'){
            fileType = fullPath.type;
            fullPath = fullPath.path;
        }

        //get parent directory path
        var parentDirectoryPath = this.getParentFolderPath(fullPath),
            parentDirectory = this.read(parentDirectoryPath);

        if(!parentDirectory) {
            throw "Cannot create file: parent directory does not exist";
        }

        var newFileName = this.getFileName(fullPath),
            currentFile = parentDirectory.read(newFileName);

        if(currentFile){
            throw "Cannot create file: file already exists!";
        }

        parentDirectory.files[newFileName] = new File({
            name: newFileName,
            path: this.constructFilePath(parentDirectory.path, newFileName),
            type: fileType
        });

        return parentDirectory.files[newFileName];

    };

    File.prototype.read = function(fullPath){

        //we would probably want some sort of filter/trim function to clean the fullPath provided
        //but in the name of saving time, I'm going to assume proper fullPath format is provided

        if(fullPath === ""){
            return this;
        }

        var keys = fullPath.split("/"),
            key,
            result = this,
            isLastKey = false;

        while(keys.length !== 0){
            key = keys.shift();

            if(key === "") {
                throw "Cannot read file: directory/file name cannot be empty string";
            }

            isLastKey = keys.length == 0;


            if(isLastKey){
                //the key can either be the current result or a file in the current result
                if(result.name === key) {
                    break;
                }
                else if(typeof result.files[key] !== 'undefined'){
                    result = result.files[key];
                }
                else {
                    result = false;
                }
            }
            //traverse through the files
            else {
                if(typeof result.files[key] !== 'undefined'){
                    result = result.files[key];
                }
                //directory or file not found, break with result of false
                else {
                    result = false;
                    break;
                }
            }
        }

        return result;

    };

    File.prototype.move = function(fromFullPath, toFullPath){

        if(fromFullPath === toFullPath) return;

        var fromFile = this.read(fromFullPath);

        if(!fromFile) {
            throw "Cannot move file: no file to move";
        }

        var toFile = this.read(toFullPath);

        if(toFile){
            throw "Cannot move file: existing file would be overwritten";
        }

        //remove file from parent then add to new folder

        var fromFileParent = this.read(this.getParentFolderPath(fromFullPath)),
            toFileParent = this.read(this.getParentFolderPath(toFullPath)),
            toFileName = this.getFileName(toFullPath);

        delete fromFileParent.files[fromFile.name];
        fromFile.name = toFileName;
        fromFile.path = toFullPath;
        toFileParent.files[toFileName] = fromFile;

        return toFileParent.files[fromFile.name];
    };

    var rootFile = new File({
            type: File.TYPES.FOLDER,
            name: "",
            path: ""
        }),

        createFunc = function(fullPaths, fileType){
            var deferred = Q.defer();

            if(typeof fullPaths === 'string'){
                var newFile = rootFile.create(fullPaths, fileType);
                deferred.resolve(newFile);
            }
            else if(fullPaths instanceof Array){
                var newFiles = [];

                for(var i=0; i<fullPaths.length; i++){
                    newFiles.push(rootFile.create(fullPaths[i]));
                }

                deferred.resolve(newFiles);
            }

            return deferred.promise;
        },

        readFunc = function(fullPaths){
            var deferred = Q.defer();

            if(typeof fullPaths === 'string'){
                deferred.resolve(rootFile.read(fullPaths));
            }
            else if(fullPaths instanceof Array){
                var files = [];

                for(var i=0; i<files.length; i++){
                    files.push(rootFile.read(fullPaths[i]));
                }

                deferred.resolve(files);
            }

            return deferred.promise;
        },

        moveFunc = function(fromFullPath, toFullPath){
            var deferred = Q.defer();

            if(typeof fromFullPath === 'string'){
                deferred.resolve(rootFile.move(fromFullPath, toFullPath));
            }
            else if(fromFullPath instanceof Array){
                var files = [];

                for(var i=0; i<fromFullPath.length; i++){
                    files.push(rootFile.move(fromFullPath[i][0], fromFullPath[i][1]));
                }

                deferred.resolve(files);
            }

            return deferred.promise;
        },

        removeFunc = function(fullPaths){
            var deferred = Q.defer();

            function removeFile(fullPath){
                var file = rootFile.read(fullPath),
                    parentFolder = rootFile.read(file.getParentFolderPath());

                delete parentFolder.files[file.name];
            }

            if(typeof fullPaths === 'string'){
                removeFile(fullPaths);
                deferred.resolve(true);
            }
            else if(fullPaths instanceof Array){
                var files = [];

                for(var i=0; i<fullPaths.length; i++){
                    removeFile(fullPaths[i]);
                }

                deferred.resolve(files);
            }

            return deferred.promise;
        },

        listAllFunc = function(){

            printFiles(rootFile);

            function printFiles(file){

                console.log(file.path + "\n");

                if(file.type === File.TYPES.FOLDER) {
                    for(var i in file.files){
                        printFiles(file.files[i]);
                    }
                }
            }
        };

    //api to expose
    return {
        create: createFunc,
        read: readFunc,
        move: moveFunc,
        remove: removeFunc,
        listAll: listAllFunc,
        File: File
    };

})(Q);