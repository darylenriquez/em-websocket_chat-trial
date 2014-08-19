// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require twitter/bootstrap
//= require turbolinks
//= require_tree .

/** Ading JS because Im still clueless about coffee script **/

console.log("start scripting");

var WebSocketClient = (function(){
  var socket;

  return {
    initialize: function(url, on_open, on_close, on_message){
      socket = new WebSocket(url);

      socket.onopen = on_open;
      socket.onclose = on_close;
      socket.onmessage = on_message;
    },
    send_message: function(message){
      socket.send(JSON.stringify(message));
    },
    disconnect: function(){
      socket.close();
    }
  }
}());

function on_open(evt){
  $("#notices").html('<div class="alert alert-success" role="alert">Connected to the server! Type in username to chat.</div>');
  $("#connect").attr('disabled', false);
  console.log("Connection open ...");
}

function on_close(evt){
  $("#notices").html('<div class="alert alert-warning" role="alert">Disconnected to the server! Chat is disabled. <button type="button" id="retry" class="btn btn-default">retry</button></div>');
  $("#connect").attr('disabled', true);
  $("#send").attr('disabled', true);
  console.log("Connection closed.");
  $("#retry").click(connect);
}

function on_message(msg){
  var data = JSON.parse(msg.data);
  if(data.type == "success"){
    $("#message_box").val($("#message_box").val() + "\n" + data.message);
  }else if(data.type == "error"){
    $("#notices").html('<div class="alert alert-warning" role="alert">' + data.message + '</div>');
  }
  console.log(msg);
}

function connect(){
  WebSocketClient.initialize("ws://localhost:8080", on_open, on_close, on_message);
}

function send_username(){
  console.log("submit username");
  if($("#username").val().trim() == ""){
    $("#notices").html('<div class="alert alert-warning" role="alert">Please input a username</div>');
  }else{
    WebSocketClient.send_message({command: "username", username: $("#username").val().trim()});
    $("#message").attr('disabled', false);
    $("#send").attr('disabled', false);
  }
}

function send_message(){
  if($("#message").val().trim() != ""){
    WebSocketClient.send_message({command: "message", username: $("#username").val().trim(), message: $("#message").val()});
    $("#message").val("");
  }
}

$(document).ready(function(){
  $("#connect").click(send_username);
  $("#send").click(send_message);

  connect();
});
