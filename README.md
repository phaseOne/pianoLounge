pianoLounge
===========

*A node-based, socket.io-powered, pianod/pianobar web GUI server*

## Requirements
* [pianod](http://deviousfish.com/pianod/) in your `$PATH` (easily installed via `brew install pianod` on OSX, but is also multiplatform)
* A [**Pandora**](http://www.pandora.com/) account (doesn't have to be a **Pandora One** account)
* [node.js](http://nodejs.org/) (obviously)

## Instructions
### Create pandora authfile
Create a file named pandoraAuth.js in the root directory like this

```js
module.exports = {
  username: 'emailhere',
  password: 'passwordhere'
}
```

### Install Dependencies
    $ bower install
    $ npm install

### Start pianoLounge
    $ npm start

## License
* [Mozilla Public License 2.0](https://www.mozilla.org/MPL/2.0/)
