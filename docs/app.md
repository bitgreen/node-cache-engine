# Bitgreen API Documentation

Serve API via command `npm run api`, API endpoint will be available at **localhost:port**, where **port** is defined in `.env` file. Default port: **3000**

---

### Base Endpoint

```
http://localhost:3000/
```

---

### Search Transactions by Account and Date

```
http://localhost:3000/transactions
```

#### Params:

```
account: account of sender or recipient
date_start: date of transaction seen on chain (optional)
date_end: date of transaction seen on chain (optional)
```

---

### Get Transaction by Hash

```
http://localhost:3000/transaction
```

#### Params:

```
hash: transaction hash you want to retrieve
```

---

### Get All Assets

Returns all _assets_

```
http://localhost:3000/assets
```

---

### Get Specific Asset

Returns _asset_ by _asset id_ **or** _project id_.

```
http://localhost:3000/asset
```

#### Params:

```
asset_id: asset id
project_id: project id
```

---

## Analyze Data

Returns all possible sections/methods fetched from a chain.

```
http://localhost:3000/analyze-data
```

#### Params:

```
section: name of section to search for (optional)
```

## Get Block Data

Get block data directly from a chain.

```
http://localhost:3000/get-block
```

#### Params:

```
block_number: block number to fetch
```

---
