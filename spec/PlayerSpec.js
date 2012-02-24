describe("Player", function(){
  var player
	it("starts with no cards", function(){
	  player = new Player()
    
    expect(player.cards()).toBeEmpty()
	})
})