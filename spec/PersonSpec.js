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
})