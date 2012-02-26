describe("BlackjackView", function(){
  var view
  
  beforeEach(function() {
    // ICanHaz stub for the card template
    ich = {card: function(){}}
    view = new BlackjackView()
  })
  
  it("has a new shuffled deck of cards", function(){
    spyOn(Deck.prototype, "shuffle")
    var diffView = new BlackjackView()
    expect(diffView.deck).toBeDefined()
    expect(diffView.deck.shuffle).toHaveBeenCalled()
  })
  
  it("overrides non-number cards proper blackjack values", function() {
    var aces = view.deck.findByRank("A")
    var tens = view.deck.findByRank(["J","Q","K"])
    
    var badAcesExist = _.any(aces, function(card){ return card.get("value") != 11 })
    var badTensExist = _.any(tens, function(card){ return card.get("value") != 10 })
    
    expect(badAcesExist).toBe(false)
    expect(badTensExist).toBe(false)
  })
  
  it("creates a player with corresponding view", function() {
    expect(view.player).toBeDefined()
    expect(view.playerView).toBeDefined()
    expect(view.playerView.model).toBe(view.player)
  })

  it("creates a dealer with corresponding view", function() {
    expect(view.dealer).toBeDefined()
    expect(view.dealerView).toBeDefined()
    expect(view.dealerView.model).toBe(view.dealer)
  })
  
  describe("#deal", function(){
    beforeEach(function() {
      spyOn(view.deck, "draw").andCallThrough()
      spyOn(view.player, "addCards").andCallThrough()      
      spyOn(view.dealer, "addCards").andCallThrough()
    })
    
    it("marks game as in progress", function(){
      expect(view.inProgress).toBe(false)
      view.deal()
      expect(view.inProgress).toBe(true)
    })
    
    it("gives player two cards from the deck", function() {
      expect(view.player.get("hand").length).toBe(0)
      view.deal()
      expect(view.deck.draw).toHaveBeenCalled()
      expect(view.player.addCards).toHaveBeenCalled()
      expect(view.deck.length).toBeLessThan(52)
      expect(view.player.get("hand").length).toBe(2)
    })
    
    it("gives dealer one card from the deck", function(){
      expect(view.dealer.get("hand").length).toBe(0)
      view.deal()
      expect(view.deck.draw).toHaveBeenCalled()
      expect(view.dealer.addCards).toHaveBeenCalled()
      expect(view.deck.length).toBe(49)
      expect(view.dealer.get("hand").length).toBe(1)
    })
  })  
})