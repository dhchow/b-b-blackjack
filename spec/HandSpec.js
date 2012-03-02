describe("Hand", function(){
  var hand;
  
  it("is a collection of cards", function(){
    hand = new Hand()
    expect(hand.model).toBe(Card)
  })
    
  describe("#hasRank", function() {
    it("returns true if hand has card of specified rank", function() {
      hand = new Hand([{suit: "spades", rank: "J"}])
      expect(hand.hasRank("J")).toBe(true)
      expect(hand.hasRank("Q")).toBe(false)
    })
  })
  
  describe("#value", function() {
    it("returns total value of cards", function(){
      hand = new Hand([
        new Card({suit: "hearts", rank: 9}), 
        new Card({suit: "spades", rank: "J"})
      ])
      expect(hand.value()).toBe(19)
    })

    it("returns value accounting for ace blackjack rules", function() {
      var hand = new Hand([
        new Card({suit: "spades", rank: 2}),
        new Card({suit: "spades", rank: 3})
      ])
      expect(hand.value()).toBe(5)
      hand.add(new Card({suit: "hearts", rank: "A"}))
      expect(hand.value()).toBe(16)
      hand.add(new Card({suit: "hearts", rank: 10}))
      expect(hand.value()).toBe(16)
      hand.add(new Card({suit: "spades", rank: "A"}))
      expect(hand.value()).toBe(17)
    })
  })
})