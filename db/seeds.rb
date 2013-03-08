# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)
require 'open-uri'
require 'json'
require 'nokogiri'

ActiveRecord::Base.connection.execute("TRUNCATE pinwheels_skills")
ActiveRecord::Base.connection.execute("TRUNCATE #{Skill.table_name}")
ActiveRecord::Base.connection.execute("TRUNCATE #{Perk.table_name}")
ActiveRecord::Base.connection.execute("TRUNCATE #{Pinwheel.table_name}")

# Create Pinwheel records from YML data
pinwheels = {}
pinwheel_file = File.join(Rails.root, 'lib', 'assets', 'pinwheels.yml')
pinwheels_data = YAML::load(File.open(pinwheel_file))
pinwheels_data.each do |key, value|
    pinwheel = Pinwheel.create do |p|
        p.id = value['unid']
        p.name = value['name']
    end
    pinwheels[key] = pinwheel
end

# Create Skill records from YML data, then link to appropriate pinwheels
skills = {}
skills_file = File.join(Rails.root, 'lib', 'assets', 'skills.yml')
skills_data = YAML::load(File.open(skills_file))
skills_data.each do |key, value|
    # Fetch other skill data form API
    url = "http://www.pinwheels.org/pinwheels/scripts/getSkillInfo.php?unid=#{value['unid']}"
    puts "Fetching data for skill ##{value['unid']}."
    data = JSON.parse open(url).read

    skill = Skill.create do |s|
        s.id = value['unid']
        s.name = value['name']
        s.attr = data['attribute']
        s.description = data['description']
    end

    value['pinwheels'].each do |name|
        pinwheel = pinwheels[name]
        pinwheel.skills << skill
    end
end

# For each pinwheel, fetch and parse descriptions and such from API
Pinwheel.all.each do |pinwheel|
    url = "http://www.pinwheels.org/pinwheels/scripts/getPinwheelInfo.php?unid=#{pinwheel.id}"
    puts "Fetching data for pinwheel ##{pinwheel.id}."
    data = JSON.parse open(url).read
    skills = data['skills']
    perk_html = Nokogiri::HTML(data['perks'])

    # Parse out perk names
    perk_html.css('a').each_with_index do |a, index|
        advanced = false
        name = ''
        description = perk_html.css("div:nth-child(#{index})").text

        # If it's an advanced perk, get the text from the span, otherwise the name is the text
        advanced_node = a.at_css('span.advanced')

        if advanced_node.nil?
            name = a.text
        else
            name = advanced_node.text
            advanced = true
        end

        perk = Perk.create do |p|
            p.name = name
            p.description = (description.nil? || description.strip == '') ? nil : description
            p.advanced = advanced
            p.pinwheel = pinwheel
        end
    end
end
