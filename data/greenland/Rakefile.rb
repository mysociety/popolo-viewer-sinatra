require 'date'
require 'fileutils'
require 'json'
require 'open-uri'

file 'popit.json' do
  POPIT_URL = 'https://inatsisartut.popit.mysociety.org/api/v0.1/export.json'
  File.write('popit.json', open(POPIT_URL).read)
end

file 'processed.json' => 'popit.json' do
  json = JSON.load(File.read('popit.json'), lambda { |h| 
    if h.class == Hash and h.has_key? 'legislative_periods'
      terms = h['legislative_periods'].sort_by { |p| p['name'] }
      terms.each_with_index do |p, i|
        p['start_date'] = p['name']
        p['name'] = "Inatsisartut #{i+1}"
        unless (i+1 == terms.size)
          p['end_date'] = Date.parse(terms[i+1]['name']) - 1
        end
      end
    end

    if h.class == Hash 
      h.reject! { |_, v| v.nil? or v.empty? }
      h.reject! { |k, v| (k == 'url' or k == 'html_url') and v[/popit.mysociety.org/] }
    end
  })
  File.write('processed.json', JSON.pretty_generate(json))
end

task :clean do
  FileUtils.rm('processed.json') if File.exist?('processed.json')
end

task :rebuild => [ :clean, 'processed.json' ]

task :default => 'processed.json'

task :install => :post_process do
  FileUtils.cp('processed.json', '../greenland.json')
end

