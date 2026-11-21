/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3346940990")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\" && status = \"active\" && @collection.memberships:auth.group ?= id && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= \"active\"",
    "updateRule": "@request.auth.id != \"\" && @collection.memberships:auth.group ?= id && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= \"active\" && @collection.memberships:auth.role ?= \"moderator\"",
    "viewRule": "@request.auth.id != \"\" && @collection.memberships:auth.group ?= id && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= \"active\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3346940990")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\" && status = \"active\" && @collection.memberships.group.id = id && @collection.memberships.user.id = @request.auth.id && @collection.memberships.status = \"active\"",
    "updateRule": "@request.auth.id != \"\" && @collection.memberships.group.id = id && @collection.memberships.user.id = @request.auth.id && @collection.memberships.status = \"active\" && @collection.memberships.role = \"moderator\"",
    "viewRule": "@request.auth.id != \"\" && @collection.memberships.group.id = id && @collection.memberships.user.id = @request.auth.id && @collection.memberships.status = \"active\""
  }, collection)

  return app.save(collection)
})
