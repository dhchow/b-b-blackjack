describe("Hand", function(){
  var hand;
  
  it("is a collection of cards", function(){
    hand = new Hand()
    expect(hand.model).toBe(Card)
  })
    
  it("can return total value of cards", function(){
    var cards = []
    _.each([{suit: "hearts", rank: 9}, {suit: "spades", rank: "J"}], function(attrs){
      cards.push(new Card(attrs))
    })
    hand = new Hand(cards)
    expect(hand.value()).toBe(20)
  })
})