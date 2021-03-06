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
    var firstCard = deck.at(0)
    var secondCard = deck.at(1)
    var thirdCard = deck.at(2)
    deck.shuffle()
    var newIndexFirst = deck.indexOf(firstCard)
    var newIndexSecond = deck.indexOf(secondCard)
    var newIndexThird = deck.indexOf(thirdCard)
    var samePlaces = newIndexFirst == 0 && newIndexSecond == 1 && newIndexThird == 2
    expect(samePlaces).toBe(false)
    var consecutive = 
      Math.abs(newIndexSecond - newIndexFirst) == 1 
      && Math.abs(newIndexThird - newIndexSecond) == 1
    expect(consecutive).toBe(false)
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
    it("refreshes the deck with the discard pile shuffled", function() {
      var cards = deck.draw(50)
      deck.discard(cards)
      expect(deck.length).toBe(2)
      var three = deck.draw(3)
      expect(three.length).toBe(3)
      expect(deck._discard.length).toBe(0)
      expect(deck.length).toBe(49)
    })
  })
  
  describe("#discard", function() {
    it("adds cards to discard pile", function() {
      var cards = deck.draw(3)
      deck.discard(cards)
      expect(deck._discard.length).toBe(3)
      expect(deck.length).toBe(49)
    })
  })
})