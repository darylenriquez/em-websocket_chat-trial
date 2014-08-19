require 'em-websocket'
EVENTCHAT_CONFIG = YAML.load_file("#{Rails.root}/config/eventchat.yml")[Rails.env].symbolize_keys

class WebsocketServer
  @sockets = {}

  def self.start
    begin
      puts "starting server..."
      EM.run do
        puts "server started at ws://#{EVENTCHAT_CONFIG[:host]}:#{EVENTCHAT_CONFIG[:port]} "
        EM::WebSocket.run(EVENTCHAT_CONFIG) do |ws|
          ws.onopen do |handshake|
            puts "WebSocket connection open"
            ws.send({:type => "success", :message => "Hello Client, you connected to #{handshake.path}"}.to_json)
          end

          ws.onclose do
            username = @sockets.invert[ws]
            @sockets.delete(username)
            @sockets.each {|s| s[:socket].send({:type => "success", :message => "#{username} has disconnected!"}.to_json)}
          end

          ws.onmessage do |msg|
            puts "Recieved message: #{msg}"
            client = JSON.parse(msg).symbolize_keys rescue false
            if client
              if(client[:username])
                case client[:command]
                when "username"
                  if(@sockets[client[:username]])
                    ws.send({:type => "error", :message => "Username taken: #{client[:username]}"}.to_json)
                  else
                    @sockets[client[:username]] = ws
                    @sockets.each {|username, socket| @sockets[username].send({:type => "success", :message => "#{client[:username]} joined chat"}.to_json)}
                  end
                when "message"
                  if(@sockets[client[:username]])
                    @sockets.each {|username, socket| @sockets[username].send({:type => "success", :message => "#{client[:username]}: #{client[:message]}"}.to_json)}
                  else
                    @sockets[client[:username]] = ws
                    @sockets.each {|username, socket| @sockets[username].send({:type => "success", :message => "#{client[:username]} joined chat\n#{client[:username]}: #{client[:message]}"})}
                  end
                else
                  ws.send({:type => "error", :message => "Unknown Command: #{client[:command].nil? ? 'No Command' : client[:command]}"}.to_json)
                end
              else
                ws.send({:type => "error", :message => "No Username: #{msg}"}.to_json)
              end
            else
              ws.send({:type => "error", :message => "Undefined message: #{msg}"}.to_json)
            end
          end
        end
      end
    rescue SystemExit, Interrupt
      puts "Server Stopped."
    rescue Exception => e
      puts e
    end
  end
end

WebsocketServer.start