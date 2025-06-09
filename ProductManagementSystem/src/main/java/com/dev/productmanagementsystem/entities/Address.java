package com.dev.productmanagementsystem.entities;

import jakarta.persistence.*;
import java.util.Set;

@Entity
@Table(name = "addresses")
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "street")
    private String street;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "postal_code")
    private String postalCode;

    @Column(name = "country")
    private String country;

    @Column(name = "phone_number")
    private String phoneNumber;

    @OneToOne(mappedBy = "address")
    private User user;

    @OneToMany(mappedBy = "shippingAddress")
    private Set<Order> shippingOrders;

    @OneToMany(mappedBy = "billingAddress")
    private Set<Order> billingOrders;




    // Constructors
    public Address() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Set<Order> getShippingOrders() { return shippingOrders; }
    public void setShippingOrders(Set<Order> shippingOrders) { this.shippingOrders = shippingOrders; }

    public Set<Order> getBillingOrders() { return billingOrders; }
    public void setBillingOrders(Set<Order> billingOrders) { this.billingOrders = billingOrders; }
}