describe("BlackjackView", function(){
  var view
  
  beforeEach(function() {
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
  
  it("creates a new player with corresponding view", function() {
    expect(view.player).toBeDefined()
    expect(view.playerView).toBeDefined()
    expect(view.playerView.model).toBe(view.player)
  })

  it("creates a view for dealer's hand", function() {
    expect(view.dealerHand).toBeDefined()
    // expect((view.dealerHand instanceOf Hand).toBe(true)
  })
  
  describe("#deal", function(){
    
    it("gives player two cards from the deck", function() {
      
    })
    
    it("gives dealer one card from the deck", function(){
      
    })
  })  
})