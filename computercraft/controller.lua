local function handleFactoryGet (request, sendMessage, factory)
  sendMessage(textutils.serialize(factory))
end

local function listenForCcpipesEvents (sendMessage, factory)
  while true do
    local event, message = os.pullEvent()

    if event == "ccpipes-FactoryGet" then
      handleFactoryGet(message, sendMessage, factory)
    end

  end
end

return {
  listenForCcpipesEvents = listenForCcpipesEvents,
}