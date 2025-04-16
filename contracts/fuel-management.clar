;; Fuel Management Contract
;; Monitors consumption and expenses

;; Define owner
(define-constant contract-owner tx-sender)

;; Define fuel record structure
(define-map records
  { id: uint }
  {
    vehicle-id: uint,
    date: uint,
    gallons: uint,
    price: uint,
    total: uint,
    odometer: uint,
    fuel-type: (string-utf8 20),
    location: (string-utf8 50)
  }
)

;; Define vehicle fuel efficiency tracking
(define-map efficiency
  { vehicle-id: uint }
  {
    gallons: uint,
    miles: uint,
    last-odometer: uint
  }
)

;; Track last record ID
(define-data-var last-id uint u0)

;; Add fuel record
(define-public (add-record
    (vehicle-id uint)
    (date uint)
    (gallons uint)
    (price uint)
    (odometer uint)
    (fuel-type (string-utf8 20))
    (location (string-utf8 50)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err u403))
    (let (
      (new-id (+ (var-get last-id) u1))
      (total (* gallons price))
      (eff (default-to { gallons: u0, miles: u0, last-odometer: u0 }
            (map-get? efficiency { vehicle-id: vehicle-id })))
      (miles-driven (if (> (get last-odometer eff) u0)
                      (- odometer (get last-odometer eff))
                      u0))
    )
      (var-set last-id new-id)
      (map-set records
        { id: new-id }
        {
          vehicle-id: vehicle-id,
          date: date,
          gallons: gallons,
          price: price,
          total: total,
          odometer: odometer,
          fuel-type: fuel-type,
          location: location
        }
      )
      (map-set efficiency
        { vehicle-id: vehicle-id }
        {
          gallons: (+ (get gallons eff) gallons),
          miles: (+ (get miles eff) miles-driven),
          last-odometer: odometer
        }
      )
      (ok new-id)
    )
  )
)

;; Get fuel record
(define-read-only (get-record (id uint))
  (map-get? records { id: id })
)

;; Get vehicle MPG
(define-read-only (get-mpg (vehicle-id uint))
  (let ((eff (map-get? efficiency { vehicle-id: vehicle-id })))
    (if (and
          (is-some eff)
          (> (get gallons (unwrap-panic eff)) u0)
        )
      (/ (get miles (unwrap-panic eff)) (get gallons (unwrap-panic eff)))
      u0
    )
  )
)

;; Get record count
(define-read-only (get-count)
  (var-get last-id)
)
