describe("Deck", function(){
  var deck
  
  beforeEach(function(){
    deck = new Deck
  })
  
	it("starts with 52 unique cards of a standard deck", function(){
    expect(deck.length).toBe(52)
        
    expect(_.uniq(deck.toJSON()).length).toBe(52)
    
    _.each(["diams", "spades", "hearts", "clubs"], function(suit){
      expect(deck.filter(function(card){
        return card.get("suit") == suit
      }).length).toBe(13)
    })
	})
  
  it("can be shuffled to randomize order", function(){
    // deck.indexOf()
    expect(_.isEqual(deck, deck)).toBe(true)
    expect(_.isEqual(deck, deck.shuffle())).toBe(false)
  })
  
  it("can draw the first n cards", function(){
    var cards = deck.draw()
    expect(cards.length).toBe(1)
    expect(deck.length).toBe(51)
    
    cards = deck.draw(5)
    expect(cards.length).toBe(5)
    expect(deck.length).toBe(46)
  })
  
  it("can retrieve cards by rank", function() {
    var jacks = deck.findByRank("J")
    expect(jacks.length).toBe(4)
    
    var multiple = deck.findByRank(["A", "Q"])
    expect(multiple.length).toBe(8)
  })
    
  describe("when asked to draw more cards than it has", function(){
    it("draws all remaining cards", function(){
      deck.reset([{suit: "hearts", rank: 7}, {suit: "spades", rank: 8}])
      expect(deck.length).toBe(2)
      var cards = deck.draw(3)
      expect(cards.length).toBe(2)
    })
  })
})