;; Maintenance Tracking Contract
;; Schedules service based on mileage

;; Define owner
(define-constant contract-owner tx-sender)

;; Define maintenance record structure
(define-map records
  { id: uint }
  {
    vehicle-id: uint,
    service-type: (string-utf8 50),
    date: uint,
    mileage: uint,
    cost: uint,
    notes: (string-utf8 100),
    next-mileage: uint
  }
)

;; Define vehicle mileage tracking
(define-map mileage
  { vehicle-id: uint }
  { current: uint }
)

;; Track last record ID
(define-data-var last-id uint u0)

;; Add maintenance record
(define-public (add-record
    (vehicle-id uint)
    (service-type (string-utf8 50))
    (date uint)
    (miles uint)
    (cost uint)
    (notes (string-utf8 100))
    (next-miles uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err u403))
    (let ((new-id (+ (var-get last-id) u1)))
      (var-set last-id new-id)
      (map-set records
        { id: new-id }
        {
          vehicle-id: vehicle-id,
          service-type: service-type,
          date: date,
          mileage: miles,
          cost: cost,
          notes: notes,
          next-mileage: next-miles
        }
      )
      (map-set mileage
        { vehicle-id: vehicle-id }
        { current: miles }
      )
      (ok new-id)
    )
  )
)

;; Update vehicle mileage
(define-public (update-mileage (vehicle-id uint) (miles uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err u403))
    (map-set mileage
      { vehicle-id: vehicle-id }
      { current: miles }
    )
    (ok true)
  )
)

;; Get maintenance record
(define-read-only (get-record (id uint))
  (map-get? records { id: id })
)

;; Get vehicle mileage
(define-read-only (get-mileage (vehicle-id uint))
  (default-to { current: u0 } (map-get? mileage { vehicle-id: vehicle-id }))
)

;; Get record count
(define-read-only (get-count)
  (var-get last-id)
)
