#}## APIs
auth
  - post /login
  - post /signup
  - get /me
  - get /me/debts
  *post /me/change-password*
groups
  - post /
  - get /
  - get /:groupId
  - post /:groupId/join
  - post /:groupId/invite
  - delete /:groupId/leave
  - delete /:groupId
  - get /:groupId/members
  - patch /:groupId/members/:userId
  - patch /:groupId
  - post /:groupId/expenses
  - get /:groupId/expenses
  - get /:groupId/balances
  - post /:groupId/settle
  - get /:groupId/transactions
  - get /:groupId/activity
expenses
  - get /:expenseId
  - patch /:expenseId
  - delete /:expenseId
transactions
  - post /:id/confirm
payments
  - post /:id

### Stack
React Native
Elysia
Tanstack queires
supabase (db + realtime)
prisma
(see how to use tanstack queries and supabase realtime)

## New Iter
- core still same, profile same
- url/qrcode same 
- when adding a cost, prompt to add the receipt (later can use ocr to only clicking a photo and selecting people)
- storing photos can be sharing a google drive link or a shared google photos link
- think of challenges later

# Better split wise
- Same core feature - track costs 
- in profile/some tab show how much you owe to each person for what trip
- send a url/qrcode to directly send the money online (or a upi link with exact amount to be paid)
* give score to a person to how fast the person pays after the cost added. (Admin can turn this off if everyone pays at the end of the trip)
- can store photos for the trip - make folders (photos can also be of receipts)
- users of the same group/trip can add challenges which everyone performs and at the end show a leaderboard of some matric the creator chose.
