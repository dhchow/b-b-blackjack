describe("BlackjackGame", function(){
  var game
  
  beforeEach(function() {
    game = new BlackjackGame()
  })
  
  it("has a new shuffled deck of cards", function(){
    spyOn(Deck.prototype, "shuffle")
    // Different game since we need to spy before creation
    var diffGame = new BlackjackGame()
    expect(diffGame.deck).toBeDefined()
    expect(diffGame.deck.shuffle).toHaveBeenCalled()
  })
  
  it("overrides non-number cards proper blackjack values", function() {
    var aces = game.deck.findByRank("A")
    var tens = game.deck.findByRank(["J","Q","K"])
    
    var badAcesExist = _.any(aces, function(card){ return card.get("value") != 11 })
    var badTensExist = _.any(tens, function(card){ return card.get("value") != 10 })
    
    expect(badAcesExist).toBe(false)
    expect(badTensExist).toBe(false)
  })
  
  it("creates a player", function() {
    expect(game.player).toBeDefined()
    // expect(game.playerView).toBeDefined()
    // expect(game.playerView.model).toBe(game.player)
  })

  it("creates a dealer", function() {
    expect(game.dealer).toBeDefined()
    // expect(game.dealerView).toBeDefined()
    // expect(game.dealerView.model).toBe(game.dealer)
  })
  
  describe("#deal", function(){
    beforeEach(function() {
      spyOn(game.deck, "draw").andCallThrough()
      spyOn(game.player, "addCards").andCallThrough()      
      spyOn(game.dealer, "addCards").andCallThrough()
    })
    
    it("marks game as in progress", function(){
      expect(game.get("inProgress")).toBe(false)
      game.deal()
      expect(game.get("inProgress")).toBe(true)
    })
    
    it("gives player two cards from the deck", function() {
      expect(game.player.get("hand").length).toBe(0)
      game.deal()
      expect(game.deck.draw).toHaveBeenCalled()
      expect(game.player.addCards).toHaveBeenCalled()
      expect(game.deck.length).toBeLessThan(52)
      expect(game.player.get("hand").length).toBe(2)
    })
    
    it("gives dealer one card from the deck", function(){
      expect(game.dealer.get("hand").length).toBe(0)
      game.deal()
      expect(game.deck.draw).toHaveBeenCalled()
      expect(game.dealer.addCards).toHaveBeenCalled()
      expect(game.deck.length).toBe(49)
      expect(game.dealer.get("hand").length).toBe(1)
    })
  })  
})