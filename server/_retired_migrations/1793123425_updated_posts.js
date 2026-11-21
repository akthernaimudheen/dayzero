/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1125843985")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && author = @request.auth.id && status = \"visible\" && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= \"active\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1125843985")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && author = @request.auth.id && status = \"visible\" && @collection.memberships.group.id = group && @collection.memberships.user.id = @request.auth.id && @collection.memberships.status = \"active\""
  }, collection)

  return app.save(collection)
})
