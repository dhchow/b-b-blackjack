describe("Deck", function(){
  var deck
  
	it("starts with 52 unique cards of a standard deck", function(){
	  deck = new Deck
    expect(deck.length).toBe(52)
        
    expect(_.uniq(deck.toJSON()).length).toBe(52)
    
    _.each(["diams", "spades", "hearts", "clubs"], function(suit){
      expect(deck.filter(function(card){
        return card.get("suit") == suit
      }).length).toBe(13)
    })
	})
  
  it("can be shuffled", function(){
    deck = new Deck
    expect(_.isEqual(deck, deck)).toBe(true)
    expect(_.isEqual(deck, deck.shuffle())).toBe(false)
  })
  
  it("can draw the first n cards < 52", function(){
    deck = new Deck
    var cards = deck.draw()
    expect(cards.length).toBe(1)
    expect(deck.length).toBe(51)
    
    cards = deck.draw(5)
    expect(cards.length).toBe(5)
    expect(deck.length).toBe(46)
  })
})