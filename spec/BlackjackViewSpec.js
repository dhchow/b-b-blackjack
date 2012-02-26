describe("BlackjackView", function(){
  var view
  
  it("has a new shuffled deck of cards", function(){
    spyOn(Deck.prototype, "shuffle")
    view = new BlackjackView()
    expect(view.deck).toBeDefined()
    expect(view.deck.shuffle).toHaveBeenCalled()
  })
  
  it("overrides non-number cards proper blackjack values", function() {
    // view = new BlackjackView()
    // view.deck.find()
  })
  
  it("creates a new player with corresponding view", function() {
    
  })

  it("creates a view for dealer's hand", function() {
    
  })
  
  describe("#deal", function(){
    
    it("gives player two cards from the deck", function() {
      
    })
    
    it("gives dealer one card from the deck", function(){
      
    })
  })  
})