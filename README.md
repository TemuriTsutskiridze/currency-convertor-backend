# Currency Convertor Nest.js Application

This backend application converts currencies. For exhange rates it uses monobank api (https://api.monobank.ua/bank/currency). It also handles cross urrencies and not only EUR to UAH or USD to UAH for example

Project implements strategy and repository patters, error handling and caching with redis

## How to set up

1. Clone the repository

```
git clone https://github.com/TemuriTsutskiridze/currency-convertor-backend.git
```

2. navigate into the project

```
cd currency-convertor-backend
```

3. Install Dependencies

```
npm i
```

4. create env.example file and insert this variables

PORT=3000

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

CACHE_TTL=300000

CB_TIMEOUT_MS=10000
CB_ERROR_THRESHOLD_PERCENT=50
CB_RESET_TIMEOUT_MS=30000
CB_ROLLING_COUNT_TIMEOUT_MS=60000
CB_ROLLING_COUNT_BUCKETS=10
CB_VOLUME_THRESHOLD=5

5. Easy setup ith docker

```
docker compose up --build
```

## Api Documentation

`POST /currency/convert`

```
{
  "sourceCurrency": "USD",
  "targetCurrency": "EUR",
  "amount": 100
}
```

Response:

```
{
  "sourceCurrency": "USD",
  "targetCurrency": "EUR",
  "sourceAmount": 100,
  "convertedAmount": 84.96176720475785,
  "exchangeRate": 0.8496176720475785,
  "timestamp": "2026-01-26T10:42:09.305Z"
}
```
