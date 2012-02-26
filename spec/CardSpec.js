describe("Card", function(){
  var card
  
  it("derives its id based on suit and rank", function(){
    card = new Card({suit: "hearts", rank: 2})
    expect(card.get("id")).toBe("2hearts")
  })
  
  it("derives its value based on rank", function(){
    card = new Card({suit: "hearts", rank: "A"})
    expect(card.get("value")).toBe(1)

    card = new Card({suit: "hearts", rank: 7})
    expect(card.get("value")).toBe(7)
      
    card = new Card({suit: "hearts", rank: "J"})
    expect(card.get("value")).toBe(11)
    
    card = new Card({suit: "hearts", rank: "Q"})
    expect(card.get("value")).toBe(12)  
    
    card = new Card({suit: "hearts", rank: "K"})
    expect(card.get("value")).toBe(13)  
  })
})