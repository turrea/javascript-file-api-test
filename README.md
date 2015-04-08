# Javascript Test
Javascript test to create in memory file api. The instructions were:

Using JavaScript, create a simple file system API (in-memory) for creating, reading, moving, and deleting files and folders. Methods should be able to operate on more than item at a time. The API should emulate the asynchronous nature of an external over-the-network API, using Promises[1] or a similar pattern.
 
[1] See http://promisesaplus.com/ or http://www.html5rocks.com/en/tutorials/es6/promises/

# Notes

I chose to use the Q promise library because that’s what Angular uses and I’ve been working with Angular for the past couple years.

The in-memory file storage API is contained in api.js, which puts the FileAPI variable on the global window scope. The API provides access to the following functions:

- create: supports both object and array of objects, each object should specify file path and file type
- read: supports both string file path and array of string file paths
- move: supports two arguments (from and to file paths), and array of objects with from and to paths
- remove: supports both string file path and array of string file paths


The API attempts to emulate asynchronous network storage by returning a promise to the caller that will be resolved at a later time. Unfortunately I didn’t have time to include errors situations (deferred.reject()).

test.html was created to allow me to test the api more easily.

