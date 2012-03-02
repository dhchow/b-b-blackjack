describe("Player", function(){
  var player
  
  beforeEach(function(){
    player = new Player()
  })
  
  it("starts with no cards in hand", function(){
    expect(player.get("hand").length).toBe(0)
  })
  
  it("starts with 500 credit", function(){
    expect(player.get("credit")).toBe(500)
  })
  
  it("starts with 0 credit bet", function(){
    expect(player.get("bet")).toBe(0)
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
  
  it("wins 1.5x bet when hand is a blackjack", function() {
    spyOn(player, "hasBlackjack").andReturn(true)
    player.set("bet", 20)
    player.win()
    expect(player.get("credit")).toBe(530)
    expect(player.get("bet")).toBe(0)
  })
  
  it("can't bet more than it has credit for", function(){
    var errorCallback = jasmine.createSpy()
    player.on("error", errorCallback)
    player.set("bet", 501)
    expect(errorCallback).toHaveBeenCalled()
  })  
})