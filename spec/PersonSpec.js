describe("Person", function() {
  var person
  it("can receive cards in hand", function(){
    person = new Person()
    var card = new Card({suit: "hearts", rank: 7})
    person.addCards(card)
    expect(person.get("hand").length).toBe(1)
    
    person.addCards([new Card({suit: "hearts", rank: 5}), new Card({suit: "hearts", rank: 3})])
    expect(person.get("hand").length).toBe(3)
  })
  
  it("triggers change event when cards are added to hand", function(){
    person = new Person()
    var changeCallback = jasmine.createSpy()
    person.on("change:hand", changeCallback)
    var card = new Card({suit: "hearts", rank: 3})
    person.addCards(card)
    expect(changeCallback).toHaveBeenCalled()
  })
  
  describe("#hasBlackjack", function() {
    it("returns true when hand has 2 cards with a hand value of 21", function() {
      person = new Person()
      person.addCards([
        new Card({suit: "spades", rank: "J"}),
        new Card({suit: "diams", rank: "A"})
      ])
      expect(person.hasBlackjack()).toBe(true)
    })
    it("returns false if hand does not have 2 cards with a hand value of 21", function() {
      person = new Person()
      person.addCards([
        new Card({suit: "spades", rank: "J"}),
        new Card({suit: "diams", rank: "Q"})
      ])
      expect(person.hasBlackjack()).toBe(false)
      
      var person2 = new Person()
      person2.addCards([
        new Card({suit: "spades", rank: "J"}),
        new Card({suit: "diams", rank: "10"}),
        new Card({suit: "diams", rank: "A"})
      ])
      expect(person2.hasBlackjack()).toBe(false)
      
      var person3 = new Person()
      person3.addCards([
        new Card({suit: "spades", rank: "J"})
      ])
      expect(person3.hasBlackjack()).toBe(false)
    })
  })
  
})