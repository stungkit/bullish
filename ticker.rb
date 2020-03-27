# frozen_string_literal: true

require 'dotenv'
require 'net/http'
require 'active_support/all'

# get historical performance by ticker symbol
class Ticker
  attr_writer :request

  INDEX = {
    sp500: '^GSPC',
    nasdaq: 'NDAQ',
    dowjones: '^DJI'
  }.freeze

  # TODO: data off sometimes, maybe add fingerprint to url
  FUNCTION = 'TIME_SERIES_DAILY'
  KEY = 'Time Series (Daily)'
  CLOSE = '4. close'

  DATE_FORMAT = '%Y-%m-%d'

  def self.period
    {
      '1D': 1.day.ago,
      '1W': 1.week.ago,
      '1M': 1.month.ago,
      '3M': 3.months.ago,
      '6M': 6.months.ago,
      'YTD': Date.new(Date.today.year, 1, 1),
      '1Y': 1.year.ago,
      '5Y': 5.years.ago,
      '10Y': 10.years.ago
    }
  end

  def initialize(symbol)
    Dotenv.load

    @symbol = symbol
  end

  def self.sp500
    new(INDEX[:sp500])
  end

  def self.nasdaq
    new(INDEX[:nasdaq])
  end

  def self.dowjones
    new(INDEX[:dowjones])
  end

  def performance_by_period(date)
    most_recent = api_data.dig(self.class.current_date).dig(CLOSE)

    # if date is weekend or holiday
    # loop to find the next date
    until market_date ||= nil
      market_date = api_data.dig(date.strftime(DATE_FORMAT))

      x = x.to_i + 1

      date += x.days

      raise "cant find data for period #{date}" if x > 20
    end

    percent_change(most_recent, market_date.dig(CLOSE)).to_s + '%'
  end

  def performance
    {}.tap do |stats|
      self.class.period.each do |key, value|
        stats[key] = performance_by_period(value)
      end
    end
  end

  def percent_change(new, original)
    (((new.to_f - original.to_f) / original.to_f) * 100).round(2)
  end

  def uri
    params = [
      'function=' + FUNCTION,
      'symbol=' + @symbol,
      'apikey=' + ENV['ALPHA_API_KEY'],
      'outputsize=full'
    ].join('&')

    URI(ENV['ALPHA_API'] + '/query?' + params)
  end

  def request
    @request ||=
      begin
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true

        http.get(uri.request_uri).tap do |r|
          unless r.code == '200'
            message = [uri.to_s, r.body].join(' - ')
            raise message
          end
        end.body
      end
  end

  def api_data
    @api_data ||=
      begin
        data = JSON.parse(request)

        # use fetch to raise if key not found
        raise data if data.dig('Error Message')

        data.fetch(KEY)
      end
  end

  def self.current_date
    Time.now.strftime(DATE_FORMAT)
  end
end
