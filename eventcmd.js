#!/usr/local/bin/node

process.stdin.on('data', function (data) {
  console.log(JSON.stringify({
    event: process.argv[2],
    data: data.toString().split('\n').reduce(function(o,v,i){var res = /(?:[^=]+=)(.+)/.exec(v); o[v.match(/[^=]+/)] = res ? res[1] : ''; return o},{})
  }))
})
