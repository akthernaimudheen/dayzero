/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1615648943")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && reporter = @request.auth.id && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= \"active\"",
    "listRule": "@request.auth.id != \"\" && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= \"active\" && @collection.memberships:auth.role ?= \"moderator\"",
    "updateRule": "@request.auth.id != \"\" && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= \"active\" && @collection.memberships:auth.role ?= \"moderator\"",
    "viewRule": "@request.auth.id != \"\" && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= \"active\" && @collection.memberships:auth.role ?= \"moderator\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1615648943")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && reporter = @request.auth.id && @collection.memberships.group.id = group && @collection.memberships.user.id = @request.auth.id && @collection.memberships.status = \"active\"",
    "listRule": "@request.auth.id != \"\" && @collection.memberships.group.id = group && @collection.memberships.user.id = @request.auth.id && @collection.memberships.status = \"active\" && @collection.memberships.role = \"moderator\"",
    "updateRule": "@request.auth.id != \"\" && @collection.memberships.group.id = group && @collection.memberships.user.id = @request.auth.id && @collection.memberships.status = \"active\" && @collection.memberships.role = \"moderator\"",
    "viewRule": "@request.auth.id != \"\" && @collection.memberships.group.id = group && @collection.memberships.user.id = @request.auth.id && @collection.memberships.status = \"active\" && @collection.memberships.role = \"moderator\""
  }, collection)

  return app.save(collection)
})
