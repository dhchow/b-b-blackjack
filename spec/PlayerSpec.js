describe("Player", function(){
  var player
  
  beforeEach(function(){
    player = new Player()
  })
  
	it("starts with no cards", function(){
    expect(player.get("cards").length).toBe(0)
	})
  
  it("starts with $500", function(){
    expect(player.get("credit")).toBe(500)
  })
  
  it("starts with $0 bet", function(){
    expect(player.get("bet")).toBe(0)
  })
  
  it("can receive cards", function(){
    var card = new Card()
    player.addCard(card)
    expect(player.get("cards").length).toBe(1)
  })
  
  it("can lose bet", function(){
    player.set("bet", 10)
    player.lose()
    expect(player.get("credit")).toBe(490)
    expect(player.get("bet")).toBe(0)
  })
  
  it("can win bet", function(){
    player.set("bet", 20)
    player.win()
    expect(player.get("credit")).toBe(520)
    expect(player.get("bet")).toBe(0)
  })
  
  it("can't bet more than it has credit for", function(){
    var errorCallback = jasmine.createSpy()
    player.on("error", errorCallback)
    player.set("bet", 501)
    expect(errorCallback).toHaveBeenCalled()
  })  
})