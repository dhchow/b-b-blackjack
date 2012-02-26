describe("Dealer", function() {
  var dealer
  it("starts with no cards in hand", function() {
    dealer = new Dealer()
    expect(dealer.get("hand")).toBeDefined()
    expect(dealer.get("hand").length).toBe(0)
  })
})