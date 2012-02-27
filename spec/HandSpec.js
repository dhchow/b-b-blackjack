describe("Hand", function(){
  var hand;
  
  it("is a collection of cards", function(){
    hand = new Hand()
    expect(hand.model).toBe(Card)
  })
    
  it("can return total value of cards", function(){
    hand = new Hand([
      new Card({suit: "hearts", rank: 9}), 
      new Card({suit: "spades", rank: "J"})
    ])
    expect(hand.value()).toBe(20)
  })
  
  describe("#hasRank", function() {
    it("returns true if hand has card of specified rank", function() {
      hand = new Hand([{suit: "spades", rank: "J"}])
      expect(hand.hasRank("J")).toBe(true)
      expect(hand.hasRank("Q")).toBe(false)
    })
  })
})